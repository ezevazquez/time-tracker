export const stringToKebabCase = (str: string): string => {
  return str
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2') 
    .replace(/\s+/g, '-') 
    .toLowerCase();
};
