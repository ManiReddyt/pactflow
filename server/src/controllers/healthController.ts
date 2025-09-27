import { Request, Response } from 'express';
import ipfsService from '../services/ipfsService';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const isConfigured = ipfsService.isServiceConfigured();
    const pinataConnected = isConfigured ? await ipfsService.testConnection() : false;
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        pinata: isConfigured ? (pinataConnected ? 'connected' : 'disconnected') : 'not_configured'
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      error: 'Health check failed'
    });
  }
};
