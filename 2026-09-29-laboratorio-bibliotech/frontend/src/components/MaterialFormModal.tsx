import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Material, MaterialInput } from '../api/types';
import { fileKind } from '../lib/format';
import { Modal } from './Modal';

interface MaterialFormModalProps {
  material: Material | null;
  onClose: () => void;
  onSaved: (material: Material) => void;
}

export function MaterialFormModal({ material, onClose, onSaved }: MaterialFormModalProps) {
  const [title, setTitle] = useState(material?.title ?? '');
  const [author, setAuthor] = useState(material?.author ?? '');
  const [description, setDescription] = useState(material?.description ?? '');
  const [subject, setSubject] = useState(material?.subject ?? '');
  const [year, setYear] = useState(material?.year ? String(material.year) : '');
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(material);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const input: MaterialInput = {};
    if (title.trim()) input.title = title.trim();
    if (author.trim()) input.author = author.trim();
    if (description.trim()) input.description = description.trim();
    if (subject.trim()) input.subject = subject.trim();
    const parsedYear = Number(year);
    if (year.trim() && Number.isInteger(parsedYear)) input.year = parsedYear;

    if (Object.keys(input).length === 0) {
      setError('Completá al menos un campo del material.');
      setSaving(false);
      return;
    }

    try {
      let saved = material
        ? await api.materials.update(material.id, input)
        : await api.materials.create(input);

      if (file) {
        saved = await api.materials.upload(saved.id, file);
      }
      if (publishNow && saved.isDraft) {
        saved = await api.materials.publish(saved.id);
      }
      onSaved(saved);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el material');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar material' : 'Nuevo material'}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Título
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={255}
            placeholder="Ej. Introducción a los sistemas"
          />
        </label>

        <label>
          Autor de la obra
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            maxLength={255}
            placeholder="Ej. Ana Gómez"
          />
        </label>

        <div className="form-row">
          <label>
            Materia
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              placeholder="Ej. Análisis de Sistemas"
            />
          </label>
          <label>
            Año
            <input
              type="number"
              min={1000}
              max={2100}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="2026"
            />
          </label>
        </div>

        <label>
          Descripción
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Una breve descripción del material."
          />
        </label>

        <label>
          Archivo (PDF o EPUB)
          <input
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {material?.file && !file && (
          <p className="muted">
            Archivo actual: {material.file.originalName} ({fileKind(material.file.mimeType)})
          </p>
        )}
        {file && (
          <p className="muted">
            Se subirá: {file.name} ({fileKind(file.type)})
          </p>
        )}

        {(!isEdit || material?.isDraft) && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
            />
            Publicar al guardar (requiere título, autor y archivo)
          </label>
        )}

        <div className="form-actions">
          <button type="button" className="button button-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
