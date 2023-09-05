const isUrlAbsolute = (url) => (url.indexOf('://') > 0 || url.indexOf('//') === 0);

export default isUrlAbsolute;