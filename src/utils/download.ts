// Helper to trigger file download from a blob response
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Get file extension for format
export function getExtension(format: string): string {
  switch (format) {
    case 'pdf': return 'pdf';
    case 'excel': return 'xlsx';
    case 'csv': return 'csv';
    default: return 'pdf';
  }
}

// Get MIME type for format
export function getMimeType(format: string): string {
  switch (format) {
    case 'pdf': return 'application/pdf';
    case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv': return 'text/csv';
    default: return 'application/pdf';
  }
}
