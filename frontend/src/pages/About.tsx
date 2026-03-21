import { Heart, Star, Share2, ExternalLink, Github, Coffee } from 'lucide-react';

const version = '1.0.0';
const features = [
  { version: '1.0.0', date: 'Marzo 2026', changes: ['Sistema multi-usuario con datos aislados', 'Panel de administración completo', 'Notificaciones por email personalizables', 'Integración con IA (Groq)', 'Zonas horarias configurables', 'Compartir datos familiares'] },
];

export function About() {
  const shareApp = () => {
    const text = 'Echa un vistazo a Family Agent, una aplicación para gestionar las finanzas familiares. ¡Increíble!';
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'Family Agent',
        text: text,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent('Recomendación: Family Agent');
    const body = encodeURIComponent(`Hola,\n\nTe recomiendo esta aplicación para gestionar las finanzas familiares:\n\nFamily Agent - ${window.location.href}\n\n¡Es muy útil!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Agent</h1>
          <p className="text-gray-500 mb-4">Gestión inteligente de finanzas familiares</p>
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            Versión {version}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Share2 size={20} className="text-primary" />
            Comparte Family Agent
          </h2>
          <p className="text-gray-600 mb-4">
            ¿Conoces a alguien que necesite organizar sus finanzas familiares? ¡Compártelo!
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shareApp}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Share2 size={18} />
              Compartir
            </button>
            <button
              onClick={sendEmail}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail size={18} />
              Enviar por email
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            ¿Te gusta la app?
          </h2>
          <p className="text-gray-600 mb-4">
            Si Family Agent te resulta útil, puedes apoiar el desarrollo de varias formas:
          </p>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">★</span>
              <span>Danos 5 estrellas en GitHub si te gusta el proyecto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">★</span>
              <span>Comparte la aplicación con familiares y amigos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">★</span>
              <span>Envíanos tus sugerencias y feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">★</span>
              <span>Reporta errores para que podamos mejorar</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart size={20} className="text-pink-500" />
            Novedades
          </h2>
          <div className="space-y-4">
            {features.map((release, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">v{release.version}</span>
                  <span className="text-sm text-gray-500">{release.date}</span>
                </div>
                <ul className="space-y-1 text-sm text-gray-600">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-income">✓</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-pink-50 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-2">
            Hecho con <span className="text-red-500">❤</span> para las familias
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Family Agent. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
