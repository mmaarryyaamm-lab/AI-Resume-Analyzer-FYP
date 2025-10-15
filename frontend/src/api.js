const API_BASE = '/api';

export async function uploadResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json();
}

export async function analyzeResume(file, jdText) {
  const form = new FormData();
  form.append('resume', file);
  form.append('jd', jdText);
  const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Analyze failed (${res.status})`);
  return res.json();
}

export async function aiSuggest(file, jdText) {
  const form = new FormData();
  form.append('resume', file);
  if (jdText) form.append('jd', jdText);
  const res = await fetch(`${API_BASE}/ai-suggest`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`AI suggest failed (${res.status})`);
  return res.json();
}

export async function extractNer(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${API_BASE}/extract-ner`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`NER failed (${res.status})`);
  return res.json();
}

export async function rewriteResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${API_BASE}/rewrite`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Rewrite failed (${res.status})`);
  return res.json();
}


export async function previewDiff(originalText, updatedText) {
  const res = await fetch(`${API_BASE}/preview-diff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_text: originalText || '', updated_text: updatedText || '' })
  });
  if (!res.ok) throw new Error(`Preview diff failed (${res.status})`);
  return res.json();
}

export async function downloadUpdated(updatedText, format = 'pdf') {
  const res = await fetch(`${API_BASE}/download-updated?format=${encodeURIComponent(format)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updated_text: updatedText || '' })
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  return blob;
}


