import React, { useRef } from 'react';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { sounds } from '../utils/audio';

export function BackupModal({ userState, setUserState, onClose }) {
  const fileInputRef = useRef(null);

  const handleExportJSON = () => {
    sounds.playBeep();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Fortnite_Sprites_Pokedex_Backup_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (typeof imported === 'object') {
          setUserState(imported);
          sounds.playLevelUp(5);
          alert('¡Copia de seguridad importada con éxito!');
          onClose();
        }
      } catch (err) {
        alert('El archivo no tiene un formato JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de reiniciar toda tu colección? Esta acción borrará todos tus Sprites marcados.')) {
      setUserState({});
      sounds.playBeep();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>
          Copia de Seguridad & Gestión
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px' }}>
          Exporta un archivo JSON de respaldo para guardar tus datos o transfírelos a otro dispositivo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button className="btn-primary" onClick={handleExportJSON}>
            <Download size={18} />
            <span>Exportar Copia de Seguridad (.json)</span>
          </button>

          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            <span>Importar Archivo de Respaldo</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            className="btn-secondary"
            onClick={handleReset}
            style={{ width: '100%', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <Trash2 size={18} />
            <span>Reiniciar Toda la Colección</span>
          </button>
        </div>
      </div>
    </div>
  );
}
