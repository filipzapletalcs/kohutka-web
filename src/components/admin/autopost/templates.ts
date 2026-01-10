import type { PostTemplate, TemplateData, TemplateId } from './types';

function getWeatherEmoji(weatherCode: number): string {
  switch (weatherCode) {
    case 1: return '☀️';
    case 2: return '🌤️';
    case 3: return '⛅';
    case 4: return '☁️';
    case 5: return '🌧️';
    case 6: return '🌨️';
    case 7: return '🌫️';
    case 8: return '⛈️';
    default: return '🌤️';
  }
}

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: 'daily',
    name: 'Denni report',
    description: 'Poznamka + kamera + odkaz',
    emoji: '📢',
    generate: (data: TemplateData): string => {
      let text = '';

      if (data.textComment) {
        text += `📢 ${data.textComment}\n\n`;
      } else {
        text += data.isOpen
          ? '📢 Areal je otevren! Prijedte si zalyzovat.\n\n'
          : '📢 Areal je dnes uzavren.\n\n';
      }

      if (data.cameraName) {
        text += `📸 Pohled z kamery: ${data.cameraName}\n\n`;
      }

      text += 'Vice info 👉 kohutka.ski';

      return text;
    },
  },

  {
    id: 'weather',
    name: 'S pocasim',
    description: 'Pocasi + poznamka + novy snih',
    emoji: '🌤️',
    generate: (data: TemplateData): string => {
      let text = '';

      const weatherEmoji = getWeatherEmoji(data.weatherCode);
      if (data.weatherText) {
        const weatherCapitalized = data.weatherText.charAt(0).toUpperCase() + data.weatherText.slice(1);
        text += `${weatherEmoji} ${weatherCapitalized} na Kohutce\n\n`;
      }

      if (data.textComment) {
        text += `📢 ${data.textComment}\n\n`;
      }

      if (data.newSnow && data.newSnow !== '0 cm') {
        text += `❄️ Novy snih: ${data.newSnow}\n\n`;
      }

      if (data.cameraName) {
        text += `📸 ${data.cameraName}`;
      }

      return text.trim();
    },
  },

  {
    id: 'morning',
    name: 'Ranni pozvanka',
    description: 'Privetivy ranni pozdrav',
    emoji: '☀️',
    generate: (data: TemplateData): string => {
      let text = '☀️ Dobre rano z Kohutky!\n\n';

      if (data.textComment) {
        text += `${data.textComment}\n\n`;
      } else if (data.isOpen) {
        text += 'Areal je pripraven, sjezdovky upravene!\n\n';
      } else {
        text += 'Dnes je areal uzavren, sledujte nas pro aktualni info.\n\n';
      }

      if (data.isOpen) {
        text += 'Prijedte si zalyzovat! 🎿\n';
      }

      if (data.cameraName) {
        text += `📸 ${data.cameraName}`;
      }

      return text.trim();
    },
  },

  {
    id: 'brief',
    name: 'Strucna',
    description: 'Jen poznamka a kamera',
    emoji: '📝',
    generate: (data: TemplateData): string => {
      let text = '';

      if (data.textComment) {
        text += data.textComment;
      } else {
        text += data.isOpen ? 'Areal otevren!' : 'Areal uzavren.';
      }

      if (data.cameraName) {
        text += `\n\n📸 ${data.cameraName} | kohutka.ski`;
      } else {
        text += '\n\nkohutka.ski';
      }

      return text;
    },
  },
];

export function getTemplateById(id: TemplateId): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.id === id);
}

export function generatePostText(
  templateId: TemplateId,
  holidayData: {
    operation?: {
      isOpen: boolean;
      textComment?: string;
      newSnow?: string;
      weather?: string;
      weatherCode?: number;
    };
  } | null,
  cameraName?: string
): string {
  if (templateId === 'custom') {
    return '';
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return 'Denni report z Kohutky!';
  }

  const templateData: TemplateData = {
    textComment: holidayData?.operation?.textComment || '',
    cameraName: cameraName || '',
    weatherText: holidayData?.operation?.weather || '',
    weatherCode: holidayData?.operation?.weatherCode || 0,
    newSnow: holidayData?.operation?.newSnow || '',
    isOpen: holidayData?.operation?.isOpen ?? false,
  };

  return template.generate(templateData);
}
