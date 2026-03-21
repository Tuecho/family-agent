import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';

const faqs = [
  {
    question: '¿Cómo creo una cuenta?',
    answer: 'Pide al administrador que te cree un usuario desde el panel de administración. Recibirás tus credenciales por email o directamente del administrador.'
  },
  {
    question: '¿Cómo registro un gasto?',
    answer: 'Ve a la sección "Contabilidad" y haz clic en "Nueva Transacción". Selecciona el tipo (gasto/ingreso), introduce la cantidad, descripción, concepto y fecha.'
  },
  {
    question: '¿Qué son los conceptos de gasto?',
    answer: 'Los conceptos categorizan tus gastos (Comida, Gasolina, Alquiler, etc.). Puedes editarlos según tus necesidades desde la configuración.'
  },
  {
    question: '¿Cómo funciona el presupuesto mensual?',
    answer: 'En "Presupuestos" puedes establecer límites mensuales para cada concepto. El sistema te mostrará cuánto has gastado y cuánto te queda disponible.'
  },
  {
    question: '¿Puedo compartir mis datos con otros usuarios?',
    answer: 'Sí. Desde tu perfil puedes invitar a otros usuarios a ver tus datos familiares. Ellos podrán ver tus transacciones, presupuestos y eventos, pero no modificarlos.'
  },
  {
    question: '¿Cómo funcionan las notificaciones por email?',
    answer: 'En tu perfil, activa las notificaciones y configura tu cuenta SMTP. Recibirás un resumen diario con tus gastos y los eventos próximos.'
  },
  {
    question: '¿El chatbot puede ayudarme con mis finanzas?',
    answer: 'Sí, el asistente IA puede analizar tus datos, explicar gastos, darte consejos de ahorro y responder preguntas sobre tu situación financiera.'
  },
  {
    question: '¿Mis datos están seguros?',
    answer: 'Sí. Cada usuario tiene sus propios datos aislados. Solo tú y las personas que tú invites pueden ver tu información.'
  },
  {
    question: '¿Puedo importar datos de Excel?',
    answer: 'Sí, en la sección Contabilidad hay un botón para importar transacciones desde un archivo Excel.'
  },
  {
    question: '¿Cómo cambio mi contraseña?',
    answer: 'Pide al administrador que la cambie desde el panel de administración, o contacta con él directamente.'
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HelpCircle className="text-primary" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Preguntas Frecuentes (FAQ)</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        {faqs.map((faq, index) => (
          <div key={index}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-600">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
