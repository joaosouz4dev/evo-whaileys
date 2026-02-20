import axios, { AxiosRequestConfig } from 'axios';
import { fetchLatestBaileysVersion, WAVersion } from 'baileys';

import { Baileys, configService } from '../config/env.config';

export const fetchLatestWaWebVersion = async (options: AxiosRequestConfig<{}>) => {
  // Check if manual version is set via configuration
  const baileysConfig = configService.get<Baileys>('BAILEYS');
  const manualVersion = baileysConfig?.VERSION;

  if (manualVersion) {
    const versionParts = manualVersion.split('.').map(Number);
    if (versionParts.length === 3 && !versionParts.some(isNaN)) {
      return {
        version: versionParts as WAVersion,
        isLatest: false,
        isManual: true,
      };
    }
  }

  try {
    const { data } = await axios.get('https://web.whatsapp.com/sw.js', {
      ...options,
      responseType: 'json',
    });

    const regex = /\\?"client_revision\\?":\s*(\d+)/;
    const match = data.match(regex);

    if (!match?.[1]) {
      return {
        version: (await fetchLatestBaileysVersion()).version as WAVersion,
        isLatest: false,
        error: {
          message: 'Could not find client revision in the fetched content',
        },
      };
    }

    const clientRevision = match[1];

    return {
      version: [2, 3000, +clientRevision] as WAVersion,
      isLatest: true,
    };
  } catch (error) {
    return {
      version: (await fetchLatestBaileysVersion()).version as WAVersion,
      isLatest: false,
      error,
    };
  }
};
