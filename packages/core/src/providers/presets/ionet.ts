/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../core/contentGenerator.js';
import type { ProviderConfig } from '../types.js';

export const IONET_ENV_KEY = 'IONET_API_KEY';
export const IONET_BASE_URL = 'https://api.intelligence.io.solutions/api/v1';

export const ionetProvider: ProviderConfig = {
  id: 'ionet',
  label: 'IO Intelligence (io.net) API Key',
  description: 'Quick setup for open-weight models on IO Intelligence',
  protocol: AuthType.USE_OPENAI,
  baseUrl: IONET_BASE_URL,
  envKey: IONET_ENV_KEY,
  // IO Intelligence serves an OpenAI-compatible API; the model catalog is
  // HF-style org/name and can change — users can edit the list in the setup
  // UI (modelsEditable). Context windows are only listed where the model
  // card publishes one.
  models: [
    { id: 'deepseek-ai/DeepSeek-V4.1-Flash' },
    { id: 'deepseek-ai/DeepSeek-V4-Pro' },
    { id: 'zai-org/GLM-5.3' },
    { id: 'moonshotai/Kimi-K3' },
    {
      id: 'deepseek-ai/DeepSeek-V3.2',
      contextWindowSize: 163840,
    },
    {
      id: 'zai-org/GLM-4.6',
      contextWindowSize: 200000,
    },
    {
      id: 'openai/gpt-oss-120b',
      contextWindowSize: 131072,
    },
    {
      id: 'openai/gpt-oss-20b',
      contextWindowSize: 131072,
    },
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct',
      contextWindowSize: 131072,
    },
    {
      id: 'moonshotai/Kimi-K2-Instruct-0905',
      contextWindowSize: 262144,
    },
  ],
  modelsEditable: true,
  modelNamePrefix: 'IO Intelligence',
  documentationUrl:
    'https://io.net/docs/reference/ai-models/create-chat-completion',
  uiGroup: 'third-party',
};
