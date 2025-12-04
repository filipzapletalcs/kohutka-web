import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowRight, Settings, Database, Camera, Gauge } from 'lucide-react';

const quickLinks = [
  {
    title: 'Správa ceníku',
    description: 'Upravovat ceny, přidávat položky a kategorie',
    icon: DollarSign,
    path: '/admin/cenik',
    color: 'bg-green-500',
  },
  {
    title: 'Správa webkamer',
    description: 'Aktivovat/deaktivovat kamery, měnit popis a pořadí',
    icon: Camera,
    path: '/admin/kamery',
    color: 'bg-blue-500',
  },
  {
    title: 'Nastavení widgetů',
    description: 'Auto/Manuální režim pro widgety na hlavní stránce',
    icon: Gauge,
    path: '/admin/widget',
    color: 'bg-purple-500',
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vítejte v administraci</h2>
        <p className="text-gray-600 mt-1">
          SKI CENTRUM KOHÚTKA - správa obsahu webu
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rychlé odkazy</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.path} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{link.description}</CardDescription>
                <Link to={link.path}>
                  <Button variant="outline" className="w-full group">
                    Otevřít
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">Databáze</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Data jsou ukládána v Supabase databázi. Změny se projeví okamžitě na webu.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-base">Nápověda</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Pro úpravu ceníku klikněte na "Správa ceníku" výše. Můžete přidávat, upravovat a mazat položky.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
