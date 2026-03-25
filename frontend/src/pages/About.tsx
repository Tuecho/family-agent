import { useState } from 'react';
import { Heart, Star, Share2, Mail, ExternalLink, Github, Coffee, MessageSquare, Code, Send, Check } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

const version = '1.0.6';

const shareText = 'Echa un vistazo a Family Agent, una aplicación para gestionar las finanzas familiares. ¡Increíble!';
const shareUrl = 'https://github.com/Tuecho/family-agent';

const shareWhatsApp = () => {
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
};

const shareTelegram = () => {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
};

const shareFacebook = () => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
};

const shareX = () => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
};
const features = [
  { version: '1.0.6', date: 'Marzo 2026', changes: [
    'Fix: Error al actualizar perfil de usuario normal',
    'Lista de usuarios disponibles para compartir datos',
    'Restaurantes y tableros de notas ahora se comparten correctamente',
    'Backup completo: todas las tablas de la base de datos incluidas',
    'UI móvil mejorada para planificación de comidas'
  ]},
  { version: '1.0.5', date: 'Marzo 2026', changes: [
    'Múltiples listas de compra con nombre y color',
    'Múltiples tableros de notas organizados por secciones',
    'Notas y productos editables',
    'Tareas familiares editables',
    'Recordar última página visitada',
    'Widget de chat oculto en página de Chat IA'
  ]},
  { version: '1.0.4', date: 'Marzo 2026', changes: [
    'Importar CSV además de Excel',
    'Botones compartir: WhatsApp, Telegram, Facebook, X',
    'Importar base de datos .db con barra de progreso',
    'Filtro de meses mejorado en contabilidad',
    'Primer usuario se crea como administrador automáticamente',
    'Repetición de eventos: diario, semanal y mensual',
    'Arreglado problema de autenticación con usuarios activos'
  ]},
  { version: '1.0.3', date: 'Marzo 2026', changes: [
    'Diseño mobile-first optimizado para dispositivos móviles',
    'Arreglado el guardado de FAQs',
    'Mejoras en la navegación móvil',
    'Mejorada la legibilidad en pantallas pequeñas'
  ]},
  { version: '1.0.2', date: 'Marzo 2026', changes: [
    'Lista de compra y tareas familiares separadas en el menú',
    'Sistema de sugerencias para usuarios',
    'Presupuestos recurrentes',
    'Eventos de varios días',
    'Subida de PDFs con extracción automática de conceptos',
    'Arreglado el cambio de avatar',
    'Portugués añadido al selector de idioma',
    'Filtro por mes y sumatorio en contabilidad',
    'Seguridad IA mejorada'
  ]},
  { version: '1.0.1', date: 'Marzo 2026', changes: [
    'Nueva sección de Notas para apuntes rápidos',
    'Lista de la compra con compartición (WhatsApp, Telegram, Email, Facebook, X)',
    'Tareas familiares con prioridades y fechas',
    'Selector de idioma (Español/Inglés/Portugués)',
    'Exportar e importar datos (backup)',
    'Contraseñas seguras con validación',
    'Auto-cierre de sesión por inactividad (5 min)',
    'FAQs editables'
  ]},
  { version: '1.0.0', date: 'Marzo 2026', changes: ['Sistema multi-usuario con datos aislados', 'Panel de administración completo', 'Notificaciones por email personalizables', 'Integración con IA (Groq)', 'Zonas horarias configurables', 'Compartir datos familiares'] },
];

export function About() {
  const [suggestionType, setSuggestionType] = useState('idea');
  const [suggestionSubject, setSuggestionSubject] = useState('');
  const [suggestionContent, setSuggestionContent] = useState('');
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [suggestionSent, setSuggestionSent] = useState(false);

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

  const [suggestionError, setSuggestionError] = useState('');

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionContent.trim()) return;

    setSuggestionError('');
    setSendingSuggestion(true);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: suggestionType,
          subject: suggestionSubject,
          content: suggestionContent
        })
      });
      
      if (response.ok) {
        setSuggestionSent(true);
        setSuggestionContent('');
        setSuggestionSubject('');
        setTimeout(() => setSuggestionSent(false), 3000);
      } else {
        const data = await response.json();
        setSuggestionError(data.error || 'Error al enviar la sugerencia');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      setSuggestionError('Error de conexión');
    }
    setSendingSuggestion(false);
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-pink-500 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg">
            <span className="text-3xl sm:text-4xl">🏠</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Family Agent</h1>
          <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">Gestión inteligente de finanzas familiares</p>
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
            <button
              onClick={shareTelegram}
              className="flex flex-col items-center gap-2 px-4 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-sm font-medium">Telegram</span>
            </button>
            <button
              onClick={shareFacebook}
              className="flex flex-col items-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium">Facebook</span>
            </button>
            <button
              onClick={shareX}
              className="flex flex-col items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm font-medium">X</span>
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={sendEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail size={18} />
              <span className="text-sm font-medium">Enviar por email</span>
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
              <span>
                Danos 5 estrellas en{' '}
                <a 
                  href="https://github.com/Tuecho/family-agent" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  GitHub
                </a>{' '}
                si te gusta el proyecto
              </span>
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
            <Code size={20} className="text-purple-500" />
            Colaboraciones y Donaciones
          </h2>
          <p className="text-gray-600 mb-4">
            ¿Quieres contribuir al proyecto o apoyar su desarrollo? ¡Hay varias formas de hacerlo!
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Github size={20} className="text-gray-800" />
                <span className="font-medium text-gray-800">Contribuir en GitHub</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Ayúdanos a mejorar el código, reporta issues o envía pull requests.
              </p>
              <a
                href="https://github.com/anomalyco/family_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                <Github size={16} />
                Ver repositorio
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Coffee size={20} className="text-purple-600" />
                <span className="font-medium text-gray-800">Invítanos un café</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Las donaciones nos ayudan a mantener el servidor y seguir desarrollando.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://ko-fi.com/familyagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
                >
                  <Coffee size={16} />
                  Ko-fi
                  <ExternalLink size={14} />
                </a>
                <a
                  href="https://www.buymeacoffee.com/familyagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                >
                  <Coffee size={16} />
                  Buy Me a Coffee
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare size={20} className="text-blue-600" />
                <span className="font-medium text-gray-800">Ideas y feedback</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                ¿Tienes ideas para nuevas funcionalidades o quieres sugerir mejoras?
              </p>
              <form onSubmit={submitSuggestion} className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={suggestionType}
                    onChange={(e) => setSuggestionType(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="bug">🐛 Error</option>
                    <option value="feedback">💬 Feedback</option>
                  </select>
                  <input
                    type="text"
                    value={suggestionSubject}
                    onChange={(e) => setSuggestionSubject(e.target.value)}
                    placeholder="Asunto (opcional)"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <textarea
                  value={suggestionContent}
                  onChange={(e) => setSuggestionContent(e.target.value)}
                  placeholder="Describe tu sugerencia, error o feedback..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
                {suggestionError && (
                  <p className="text-red-500 text-sm">{suggestionError}</p>
                )}
                <button
                  type="submit"
                  disabled={sendingSuggestion || !suggestionContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {sendingSuggestion ? (
                    <>Enviando...</>
                  ) : suggestionSent ? (
                    <>
                      <Check size={16} />
                      ¡Enviado!
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar sugerencia
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
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
