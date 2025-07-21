import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from '@/components/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

/**
 * Dashboard page component
 * 
 * This page displays user statistics and overview information.
 * It is protected and requires authentication.
 */
function DashboardPageContent() {
  // Placeholder data
  const stats = [
    {
      title: "Total Users",
      value: "2,543",
      change: "+12.5%",
      icon: "👥",
    },
    {
      title: "Active Sessions",
      value: "1,234",
      change: "+8.2%",
      icon: "📊",
    },
    {
      title: "Revenue",
      value: "$45,231",
      change: "+20.1%",
      icon: "💰",
    },
    {
      title: "Growth",
      value: "23.5%",
      change: "+4.3%",
      icon: "📈",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header title="Dashboard" description="Welcome to your dashboard" />
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <span className="text-2xl">{stat.icon}</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  )
} 