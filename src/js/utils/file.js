export function download(content, name, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function readText(file) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(rd.result);
    rd.onerror = () => reject(rd.error);
    rd.readAsText(file);
  });
}

export function copyText(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(txt).catch(() => copyFallback(txt));
  return copyFallback(txt);
}

function copyFallback(txt) {
  const t = document.createElement('textarea');
  t.value = txt;
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  } finally {
    t.remove();
  }
}
