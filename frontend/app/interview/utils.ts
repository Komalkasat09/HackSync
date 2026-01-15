/**
 * Utility functions for interview module
 */

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'hard':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Format time duration
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

/**
 * Format category name
 */
export function formatCategoryName(category: string): string {
  return category
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Request camera and microphone permissions
 */
export async function requestMediaPermissions(): Promise<{
  camera: boolean;
  microphone: boolean;
  stream?: MediaStream;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    return {
      camera: true,
      microphone: true,
      stream,
    };
  } catch (error: any) {
    console.error('Media permission error:', error);

    // Try camera only
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      return {
        camera: true,
        microphone: false,
        stream,
      };
    } catch {
      return {
        camera: false,
        microphone: false,
      };
    }
  }
}

/**
 * Stop media stream
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Get browser info
 */
export function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  return browser;
}

/**
 * Estimate confidence from answer text
 */
export function estimateConfidence(answer: string): number {
  // Simple heuristic based on answer characteristics
  let confidence = 0.5;

  // Length factor
  if (answer.length > 200) confidence += 0.1;
  if (answer.length > 400) confidence += 0.1;

  // Structure indicators
  const hasStructure = /first|second|finally|because|however|therefore/i.test(answer);
  if (hasStructure) confidence += 0.15;

  // Technical terms (simplified)
  const hasTechnicalTerms = /\b(function|class|component|api|database|algorithm)\b/i.test(answer);
  if (hasTechnicalTerms) confidence += 0.1;

  // Code snippets or examples
  const hasCode = /```|`\w+`|\(\)|\{\}/.test(answer);
  if (hasCode) confidence += 0.05;

  return Math.min(1.0, confidence);
}
