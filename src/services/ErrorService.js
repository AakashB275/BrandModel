import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {Alert} from 'react-native';

class ErrorService {
  constructor() {
    this.errorLogs = [];
    this.maxLogs = 100;
    this.setupGlobalErrorHandler();
  }

  setupGlobalErrorHandler() {
    // Global error handler for unhandled errors
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.logError(error, {
        isFatal,
        type: 'global',
        timestamp: Date.now(),
      });
      
      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  async logError(error, metadata = {}) {
    try {
      const errorLog = {
        id: this.generateErrorId(),
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        type: error.name || 'Error',
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          platform: 'mobile',
          version: '1.0.0', // You can get this from package.json
        },
      };

      // Store locally
      this.errorLogs.push(errorLog);
      
      // Keep only recent logs
      if (this.errorLogs.length > this.maxLogs) {
        this.errorLogs = this.errorLogs.slice(-this.maxLogs);
      }

      // Save to AsyncStorage
      await this.saveErrorLogs();

      // Send to Firestore if online
      await this.sendErrorToFirestore(errorLog);

      console.error('Error logged:', errorLog);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async saveErrorLogs() {
    try {
      await AsyncStorage.setItem('error_logs', JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  async loadErrorLogs() {
    try {
      const logs = await AsyncStorage.getItem('error_logs');
      if (logs) {
        this.errorLogs = JSON.parse(logs);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  }

  async sendErrorToFirestore(errorLog) {
    try {
      await firestore().collection('error_logs').add({
        ...errorLog,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to send error to Firestore:', error);
    }
  }

  generateErrorId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Specific error handlers
  async handleAuthError(error, context = '') {
    await this.logError(error, {
      type: 'auth',
      context,
    });

    // Show user-friendly message
    Alert.alert(
      'Authentication Error',
      'There was a problem with your account. Please try signing in again.',
      [{text: 'OK'}]
    );
  }

  async handleNetworkError(error, context = '') {
    await this.logError(error, {
      type: 'network',
      context,
    });

    Alert.alert(
      'Connection Error',
      'Please check your internet connection and try again.',
      [{text: 'OK'}]
    );
  }

  async handleFirestoreError(error, context = '') {
    await this.logError(error, {
      type: 'firestore',
      context,
    });

    Alert.alert(
      'Data Error',
      'There was a problem saving your data. Please try again.',
      [{text: 'OK'}]
    );
  }

  async handleImageError(error, context = '') {
    await this.logError(error, {
      type: 'image',
      context,
    });

    Alert.alert(
      'Image Error',
      'There was a problem with your image. Please try selecting a different one.',
      [{text: 'OK'}]
    );
  }

  async handlePaymentError(error, context = '') {
    await this.logError(error, {
      type: 'payment',
      context,
    });

    Alert.alert(
      'Payment Error',
      'There was a problem processing your payment. Please try again or contact support.',
      [{text: 'OK'}]
    );
  }

  // Validation error handler
  async handleValidationError(field, message) {
    const error = new Error(`Validation failed for ${field}: ${message}`);
    await this.logError(error, {
      type: 'validation',
      field,
      message,
    });
  }

  // Performance error handler
  async handlePerformanceError(operation, duration, threshold) {
    const error = new Error(`Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
    await this.logError(error, {
      type: 'performance',
      operation,
      duration,
      threshold,
    });
  }

  // Custom error handler
  async handleCustomError(message, type = 'custom', metadata = {}) {
    const error = new Error(message);
    await this.logError(error, {
      type,
      ...metadata,
    });
  }

  // Error reporting
  async reportError(error, userId = null, context = {}) {
    try {
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        userId,
        context,
        timestamp: firestore.FieldValue.serverTimestamp(),
        resolved: false,
      };

      await firestore().collection('error_reports').add(errorReport);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Error analytics
  async trackErrorRate(errorType, screenName) {
    try {
      await firestore().collection('error_analytics').add({
        errorType,
        screenName,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to track error rate:', error);
    }
  }

  // Error recovery
  async attemptRecovery(error, recoveryAction) {
    try {
      await recoveryAction();
      await this.logError(error, {
        type: 'recovery',
        recovered: true,
      });
    } catch (recoveryError) {
      await this.logError(recoveryError, {
        type: 'recovery',
        recovered: false,
        originalError: error.message,
      });
    }
  }

  // Error monitoring
  async getErrorStats() {
    try {
      const stats = {
        totalErrors: this.errorLogs.length,
        errorsByType: {},
        recentErrors: this.errorLogs.slice(-10),
      };

      this.errorLogs.forEach(log => {
        const type = log.metadata?.type || 'unknown';
        stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  // Clear error logs
  async clearErrorLogs() {
    try {
      this.errorLogs = [];
      await AsyncStorage.removeItem('error_logs');
      console.log('Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  // Error boundary helper
  async handleComponentError(error, errorInfo) {
    await this.logError(error, {
      type: 'component',
      componentStack: errorInfo.componentStack,
    });
  }

  // Network error detection
  isNetworkError(error) {
    return (
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('connection') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  // Retry mechanism
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    await this.logError(lastError, {
      type: 'retry',
      maxRetries,
      attempts: maxRetries,
    });
    
    throw lastError;
  }
}

export default new ErrorService();
