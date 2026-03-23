import { useState, useRef } from 'react';
import { Upload, Database, CheckCircle, AlertCircle, X, Shield } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function ImportDB({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.db')) {
        setError('Por favor, selecciona un archivo de base de datos válido (.db)');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setMessage('');
      setProgress(0);
    }
  };

  const handleImport = () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(false);
    setMessage('');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setSuccess(true);
          setProgress(100);
          setMessage(data.message || 'Base de datos importada correctamente');
          
          if (onImportComplete) {
            setTimeout(() => {
              onImportComplete();
            }, 1500);
          }
        } catch (e) {
          setError('Error procesando respuesta del servidor');
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || 'Error importando base de datos');
        } catch (e) {
          setError('Error importando base de datos');
        }
      }
      setImporting(false);
    });

    xhr.addEventListener('error', () => {
      setError('Error de conexión con el servidor');
      setImporting(false);
    });

    xhr.addEventListener('abort', () => {
      setError('Importación cancelada');
      setImporting(false);
    });

    const headers = getAuthHeaders();
    xhr.open('POST', `${API_URL}/api/import/db`);
    for (const key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }
    xhr.send(formData);
  };

  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
    setError(null);
    setProgress(0);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        title="Importar backup de base de datos"
      >
        <Database size={20} />
        Importar DB
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Database className="text-purple-600" size={24} />
                Importar Base de Datos
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Solo administradores</h4>
                  <p className="text-sm text-amber-700">
                    Esta función solo está disponible para administradores del sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-1">⚠️ Aviso importante</h4>
              <p className="text-sm text-red-700">
                Importar una base de datos substituirá los datos actuales. Asegúrate de tener un backup antes de continuar.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <Database className="text-purple-600" size={32} />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-600">
                    Haz clic o arrastra un archivo .db aquí
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Archivo de backup de SQLite
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg mt-4">
                <CheckCircle size={20} />
                <span>{message}</span>
              </div>
            )}

            {importing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Subiendo archivo...</span>
                  <span className="text-sm font-medium text-purple-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {progress < 100 ? 'Por favor, espera...' : '¡Completado!'}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
