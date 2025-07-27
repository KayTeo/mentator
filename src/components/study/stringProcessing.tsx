
export function processString(input: string){

    var processedString = input;

    processedString = sanitizeLatexInput(processedString);
    
    // Insert $$ so katex will render the latex
    
    // This commented code automatically tries to turn it into latex by wrapping in $$ and escaping spaces.
    // However, problem with rendering curly brackets. For now, user manaully enters $ $
    // processedString = `${processedString}`;
    // processedString = processedString.replace(/ /g, '\\ ');

    return processedString;
}

/**
 * Sanitizes Unicode characters that are incompatible with LaTeX
 * @param text - The text to sanitize
 * @returns The sanitized text with LaTeX-compatible replacements
 */
function sanitizeLatexInput(text: string): string {
return text
    .replace(/′/g, "'") // Replace Unicode prime (8242) with regular apostrophe
    .replace(/″/g, '"') // Replace Unicode double prime (8243) with regular quote
    .replace(/…/g, '...') // Replace Unicode ellipsis with three dots
    .replace(/–/g, '-') // Replace Unicode en dash with regular hyphen
    .replace(/—/g, '-') // Replace Unicode em dash with regular hyphen
    .replace(/×/g, '\\times') // Replace Unicode multiplication with LaTeX times
    .replace(/÷/g, '\\div') // Replace Unicode division with LaTeX div
    .replace(/±/g, '\\pm') // Replace Unicode plus-minus with LaTeX pm
    .replace(/≤/g, '\\leq') // Replace Unicode less-than-or-equal with LaTeX leq
    .replace(/≥/g, '\\geq') // Replace Unicode greater-than-or-equal with LaTeX geq
    .replace(/≠/g, '\\neq') // Replace Unicode not-equal with LaTeX neq
    .replace(/≈/g, '\\approx') // Replace Unicode approximately equal with LaTeX approx
    .replace(/∞/g, '\\infty') // Replace Unicode infinity with LaTeX infty
    .replace(/√/g, '\\sqrt') // Replace Unicode square root with LaTeX sqrt
    .replace(/²/g, '^2') // Replace Unicode superscript 2 with LaTeX superscript
    .replace(/³/g, '^3') // Replace Unicode superscript 3 with LaTeX superscript
    .replace(/₁/g, '_1') // Replace Unicode subscript 1 with LaTeX subscript
    .replace(/₂/g, '_2') // Replace Unicode subscript 2 with LaTeX subscript
    .replace(/₃/g, '_3'); // Replace Unicode subscript 3 with LaTeX subscript
}
