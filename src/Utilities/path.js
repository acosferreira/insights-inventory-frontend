function getBaseName(pathname) {
  let release = '/';
  const pathName = pathname.split('/');

  pathName.shift();

  if (pathName[0] === 'beta') {
    pathName.shift();
    release = `/beta/`;
  }

  return `${release}`;
}

function resolveRelPath(path = '') {
  return `${path.length > 0 ? `/${path}` : ''}`;
}

export { getBaseName, resolveRelPath };
