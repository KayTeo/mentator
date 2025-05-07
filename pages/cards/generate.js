import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Layout from '../../components/Layout';
import CodeEditor from '../../components/CodeEditor';
import { initPyodide, runPythonCode, getExampleCode, loadPythonPackage } from '../../lib/pyodideService';
import { createCard } from '../../lib/db';

export default function GenerateCards() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('code');
  const [code, setCode] = useState('');
  const [parameters, setParameters] = useState({
    num_cards: 5,
    topic: 'general'
  });
  const [generatedCards, setGeneratedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [output, setOutput] = useState('');

  // Initialize Pyodide when the component mounts
  useEffect(() => {
    const loadPyodide = async () => {
      if (typeof window !== 'undefined' && !pyodideReady && !pyodideLoading) {
        try {
          setPyodideLoading(true);
          await initPyodide();
          setPyodideReady(true);
          setError(null);
          
          // Set default example code
          setCode(getExampleCode());
        } catch (err) {
          console.error('Failed to initialize Pyodide:', err);
          setError(`Failed to initialize Python environment: ${err.message}`);
        } finally {
          setPyodideLoading(false);
        }
      }
    };

    loadPyodide();
  }, []);

  // Fetch user's decks when session is available
  useEffect(() => {
    const fetchDecks = async () => {
      if (!session) return;
      
      try {
        setIsLoading(true);
        
        // First get the decks
        const { data: userDecks, error: decksError } = await supabase
          .from('decks')
          .select('id, name, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (decksError) throw decksError;
        
        // If we have decks, get the card counts for each deck
        if (userDecks && userDecks.length > 0) {
          const decksWithCounts = await Promise.all(
            userDecks.map(async (deck) => {
              const { count, error: countError } = await supabase
                .from('cards')
                .select('id', { count: 'exact', head: true })
                .eq('deck_id', deck.id);
              
              return {
                ...deck,
                card_count: countError ? 0 : count || 0
              };
            })
          );
          
          setDecks(decksWithCounts);
          setSelectedDeckId(decksWithCounts[0].id);
        } else {
          setDecks([]);
        }
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError('Failed to load decks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDecks();
  }, [session, supabase]);

  // Handle parameter changes
  const handleParameterChange = (name, value) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Extract cards from Python output
  const extractCardsFromOutput = (result) => {
    // Look for cards in the result object first
    if (result.result && Array.isArray(result.result)) {
      return result.result;
    }
    
    // Try to find cards in the stdout
    if (result.stdout) {
      const lines = result.stdout.split('\n');
      const cards = [];
      let currentCard = null;
      
      for (const line of lines) {
        if (line.startsWith('Card ')) {
          if (currentCard) {
            cards.push(currentCard);
          }
          currentCard = { front: '', back: '' };
        } else if (currentCard && line.trim().startsWith('Front:')) {
          currentCard.front = line.trim().replace('Front:', '').trim();
        } else if (currentCard && line.trim().startsWith('Back:')) {
          currentCard.back = line.trim().replace('Back:', '').trim();
        }
      }
      
      if (currentCard) {
        cards.push(currentCard);
      }
      
      if (cards.length > 0) {
        return cards;
      }
    }
    
    return null;
  };

  // Run Python code to generate cards
  const handleGenerateCards = async () => {
    if (!pyodideReady) {
      setError('Python environment is not ready yet. Please wait or refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      // Add parameters to the code
      const parameterizedCode = `
# Set parameters
num_cards = ${parameters.num_cards}
topic = "${parameters.topic}"

${code}
`;

      // Run the Python code
      const result = await runPythonCode(parameterizedCode);
      
      // Store the full output for debugging
      setOutput(result.stdout || '');
      
      if (!result.success) {
        console.log('Python execution error:', result);
        
        // Create a detailed error message with all available information
        let errorDetails = [];
        
        if (result.error) {
          errorDetails.push(`Error: ${result.error}`);
        }
        
        if (result.stderr) {
          errorDetails.push(`Standard Error: ${result.stderr}`);
        }
        
        if (result.stdout) {
          errorDetails.push(`Standard Output: ${result.stdout}`);
        }
        
        // Join all error details with line breaks
        const detailedError = errorDetails.join('\n\n');
        
        // Show error in UI
        setError(detailedError || 'Unknown error during Python code execution');
        throw new Error(detailedError || 'Failed to execute Python code');
      }

      // Extract cards from the output
      const cards = extractCardsFromOutput(result);
      
      if (cards && cards.length > 0) {
        setGeneratedCards(cards);
        setActiveTab('preview');
      } else {
        throw new Error('No valid flashcards found in the output. Make sure your code returns a list of dictionaries with "front" and "back" keys.');
      }
    } catch (err) {
      console.error('Error generating cards:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save generated cards to the database
  const handleSaveCards = async () => {
    if (!session) {
      setError('You must be logged in to save cards');
      return;
    }
    
    if (!selectedDeckId) {
      setError('Please select a deck to save cards to');
      return;
    }
    
    if (generatedCards.length === 0) {
      setError('No cards to save. Please generate cards first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save each card to the selected deck
      for (const card of generatedCards) {
        await createCard({
          deckId: selectedDeckId,
          front: card.front,
          back: card.back,
          tags: ['generated']
        });
      }
      
      setSuccessMessage(`Successfully saved ${generatedCards.length} cards to your deck!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      // Navigate to the cards page after a short delay
      setTimeout(() => {
        router.push('/cards');
      }, 2000);
    } catch (err) {
      console.error('Error saving cards:', err);
      setError(`Failed to save cards: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Generate Flashcards with Python</h1>
        
        {/* Pyodide Status */}
        <div className="mb-6">
          {pyodideLoading ? (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
              <p className="font-bold">Loading Python Environment...</p>
              <p>This may take a few moments. Please wait.</p>
            </div>
          ) : pyodideReady ? (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <p className="font-bold">Python Environment Ready</p>
              <p>You can now write and execute Python code to generate flashcards.</p>
            </div>
          ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">Python Environment Not Available</p>
              <p>There was a problem loading the Python environment. Please refresh the page or try again later.</p>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 whitespace-pre-wrap">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
            <p className="font-bold">Success</p>
            <p>{successMessage}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'code'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('code')}
              >
                Python Code
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'parameters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('parameters')}
              >
                Parameters
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('preview')}
              >
                Preview Cards
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'output'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === 'code' && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Python Code</h2>
              <p className="mb-4 text-gray-600">
                Write Python code to generate flashcards. Your code should define a <code>generate_flashcards</code> function
                that returns a list of dictionaries with <code>front</code> and <code>back</code> keys.
              </p>
              <div className="h-96 mb-4">
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  language="python"
                  height="100%"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'parameters' && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Parameters</h2>
              <p className="mb-4 text-gray-600">
                Customize the parameters for your card generation function.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="font-medium text-gray-700">
                    Number of Cards
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={parameters.num_cards}
                      onChange={(e) => handleParameterChange('num_cards', parseInt(e.target.value) || 1)}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="font-medium text-gray-700">
                    Topic
                  </label>
                  <div className="md:col-span-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={parameters.topic}
                      onChange={(e) => handleParameterChange('topic', e.target.value)}
                    >
                      <option value="general">General Knowledge</option>
                      <option value="math">Math</option>
                      <option value="vocabulary">Vocabulary</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'preview' && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Preview Generated Cards</h2>
              
              {/* Deck Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Select Deck</h3>
                {decks.length > 0 ? (
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                  >
                    {decks.map(deck => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name} ({deck.card_count || 0} cards)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    You don't have any decks yet. Please create a deck first.
                  </div>
                )}
              </div>
              
              {generatedCards.length > 0 ? (
                <div className="space-y-4">
                  {generatedCards.map((card, index) => (
                    <div key={index} className="border border-gray-300 rounded-md p-4">
                      <div className="font-medium mb-2">Front:</div>
                      <div className="p-3 bg-gray-100 rounded mb-4">{card.front}</div>
                      <div className="font-medium mb-2">Back:</div>
                      <div className="p-3 bg-gray-100 rounded">{card.back}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No cards generated yet. Click the "Generate Cards" button to create cards from your Python code.
                </p>
              )}
            </div>
          )}
          
          {activeTab === 'output' && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Python Output</h2>
              <p className="mb-4 text-gray-600">
                This shows the raw output from your Python code execution. Useful for debugging.
              </p>
              
              <div className="bg-gray-800 text-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap h-96 overflow-y-auto">
                {output || 'No output yet. Run your code to see output here.'}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
            onClick={handleGenerateCards}
            disabled={isLoading || !pyodideReady || !code}
          >
            {isLoading ? 'Generating...' : 'Generate Cards'}
          </button>
          
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
            onClick={handleSaveCards}
            disabled={isLoading || generatedCards.length === 0}
          >
            {isLoading ? 'Saving...' : 'Save Cards'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
