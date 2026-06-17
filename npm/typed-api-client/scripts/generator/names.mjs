const reserved = new Set([
  'string','number','boolean','object','null','undefined','any','unknown','void','never','class','interface','type','export','import','default','function','const','let','var','new','return','if','else','switch','case','break','continue','for','while','do','try','catch','finally','throw','extends','implements','private','public','protected','static','readonly','async','await','yield','in','of','as','from','enum','delete'
]);

export function pascalCase(value = '') {
  const text = String(value).replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  const parts = text.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const result = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return result || 'Anonymous';
}

export function camelCase(value = '') {
  const pascal = pascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function safeIdentifier(value, fallback = 'value') {
  let id = camelCase(String(value || fallback));
  id = id.replace(/[^A-Za-z0-9_$]/g, '_');
  if (!/^[A-Za-z_$]/.test(id)) id = `_${id}`;
  if (reserved.has(id)) id = `${id}_`;
  return id;
}

export function safeTypeName(value, fallback = 'Model') {
  let id = pascalCase(String(value || fallback)).replace(/[^A-Za-z0-9_$]/g, '');
  if (!/^[A-Za-z_$]/.test(id)) id = `_${id}`;
  if (reserved.has(id)) id = `${id}Model`;
  return id || fallback;
}

export function quoteProperty(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !reserved.has(name) ? name : JSON.stringify(name);
}

export function methodNameFromOperation(operation, httpMethod, route) {
  return safeIdentifier(operation.operationId || `${httpMethod}_${route}`);
}

export function controllerNameFromOperation(operation, route, options = {}) {
  const tag = operation.tags?.[0];
  if (tag) return safeTypeName(tag.replace(options.controllerNameSuffixRegex ?? /(Controller|Api)$/i, ''));
  const firstRoutePart = String(route).split('/').filter(Boolean)[0] || 'Default';
  return safeTypeName(firstRoutePart.replace(/[{}]/g, ''));
}

export function refName(ref) {
  return safeTypeName(decodeURIComponent(String(ref).split('/').pop() || 'Anonymous'));
}

export function uniqueName(base, used) {
  let name = base;
  let index = 2;
  while (used.has(name)) {
    name = `${base}${index++}`;
  }
  used.add(name);
  return name;
}
