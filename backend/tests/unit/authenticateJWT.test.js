import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../../middlewares/authenticateJWT.js';
import { UnauthorizedError } from '../../utils/appError.js';

// Mock express response and next
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Unit Test: authenticateJWT Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = mockResponse();
    next = jest.fn();
  });

  test('should throw UnauthorizedError if Authorization header is missing', () => {
    authenticateJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0][0].message).toBe('Access token is missing or malformed');
  });

  test('should throw UnauthorizedError if token is malformed', () => {
    req.headers.authorization = 'Bearer';
    authenticateJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test('should call next and bind req.user if token is valid', () => {
    const payload = { userId: 'user123', role: 'Doctor' };
    const secret = 'dev_access_secret_key_9988776655';
    const token = jwt.sign(payload, secret);
    
    req.headers.authorization = `Bearer ${token}`;
    authenticateJWT(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user123');
    expect(req.user.role).toBe('Doctor');
  });

  test('should throw UnauthorizedError if token is expired', () => {
    const payload = { userId: 'user123', role: 'Doctor' };
    const secret = 'dev_access_secret_key_9988776655';
    // Expired in past
    const token = jwt.sign(payload, secret, { expiresIn: '-1s' });
    
    req.headers.authorization = `Bearer ${token}`;
    authenticateJWT(req, res, next);
    
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0][0].message).toBe('Access token has expired');
  });
});
