const API_BASE = '/api'

function getAuthToken() {
  try {
    return localStorage.getItem('resume_auth_token') || ''
  } catch {
    return ''
  }
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getAuthToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.blob()

  if (isJson && payload && payload.success === false) {
    const message = payload.error || payload.detail || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  if (!response.ok) {
    const message = isJson ? payload?.error || payload?.detail || 'Request failed' : `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

function buildForm(file, extras = {}) {
  const form = new FormData()
  form.append('resume', file)

  Object.entries(extras).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, value)
    }
  })

  return form
}

export async function uploadResume(file) {
  return apiFetch('/upload', { method: 'POST', body: buildForm(file) })
}

export async function analyzeResume(file, jdText) {
  return apiFetch('/analyze', { method: 'POST', body: buildForm(file, { jd: jdText }) })
}

export async function aiSuggest(file, jdText) {
  return apiFetch('/ai-suggest', { method: 'POST', body: buildForm(file, { jd: jdText }) })
}

export async function extractNer(file) {
  return apiFetch('/extract-ner', { method: 'POST', body: buildForm(file) })
}

export async function rewriteResume(file) {
  return apiFetch('/rewrite', { method: 'POST', body: buildForm(file) })
}

export async function smartParseResume(file) {
  return apiFetch('/smart-parse', { method: 'POST', body: buildForm(file) })
}

export async function smartRewriteResume(sections, jobDescription, model = 'gpt-4o-mini') {
  return apiFetch('/smart-rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sections,
      job_description: jobDescription || '',
      model,
    }),
  })
}

export async function previewDiff(originalText, updatedText) {
  return apiFetch('/preview-diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_text: originalText || '',
      updated_text: updatedText || '',
    }),
  })
}

export async function downloadUpdated(updatedText, format = 'pdf') {
  return apiFetch(`/download-updated?format=${encodeURIComponent(format)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updated_text: updatedText || '' }),
  })
}

export async function smartDownloadResume({
  fileName,
  fileType,
  mappings,
  acceptedSections,
  originalText,
  outputFormat,
}) {
  return apiFetch('/smart-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_name: fileName,
      file_type: fileType,
      mappings,
      accepted_sections: acceptedSections,
      original_text: originalText || '',
      output_format: outputFormat,
    }),
  })
}

export async function loginUser({ email, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function signupUser({ name, email, password }) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
}

export async function fetchHistory() {
  return apiFetch('/history', { method: 'GET' })
}

export async function fetchCurrentUser() {
  return apiFetch('/auth/me', { method: 'GET' })
}

export async function retrainAtsModel() {
  return apiFetch('/admin/retrain-model', { method: 'POST' })
}

export async function deleteResume(fileName = '') {
  return apiFetch('/delete_resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName }),
  })
}
