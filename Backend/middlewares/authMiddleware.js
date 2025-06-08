import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next(); 
    } catch (error) {
        console.error('Token verification failed:', error.message); 
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export default authMiddleware;
