export const cookieParser = (req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    cookies.forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      if (name) {
        req.cookies[name.trim()] = rest.join('=').trim();
      }
    });
  }

  next();
};

export default cookieParser;
