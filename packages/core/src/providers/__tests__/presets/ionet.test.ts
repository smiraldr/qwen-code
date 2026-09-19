/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { AuthType } from '../../../core/contentGenerator.js';
import { ionetProvider } from '../../presets/ionet.js';
import {
  ALL_PROVIDERS,
  THIRD_PARTY_PROVIDERS,
  findProviderByCredentials,
  findProviderById,
  getAllProviderBaseUrls,
} from '../../all-providers.js';
import { buildInstallPlan } from '../../provider-config.js';

describe('ionetProvider', () => {
  it('has correct provider config', () => {
    expect(ionetProvider).toMatchObject({
      id: 'ionet',
      label: 'IO Intelligence (io.net) API Key',
      protocol: AuthType.USE_OPENAI,
      baseUrl: 'https://api.intelligence.io.solutions/api/v1',
      envKey: 'IONET_API_KEY',
      modelsEditable: true,
      uiGroup: 'third-party',
    });
  });

  it('exposes open-weight models with context windows from the endpoint catalog', () => {
    expect(ionetProvider.models).toEqual([
      { id: 'deepseek-ai/DeepSeek-V4.1-Flash', contextWindowSize: 262124 },
      { id: 'deepseek-ai/DeepSeek-V4-Pro', contextWindowSize: 1048576 },
      { id: 'zai-org/GLM-5.3', contextWindowSize: 262144 },
      { id: 'moonshotai/Kimi-K3', contextWindowSize: 1048576 },
      { id: 'deepseek-ai/DeepSeek-V3.2', contextWindowSize: 163840 },
      { id: 'zai-org/GLM-4.6', contextWindowSize: 131072 },
      { id: 'openai/gpt-oss-120b', contextWindowSize: 131072 },
      { id: 'openai/gpt-oss-20b', contextWindowSize: 64000 },
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct',
        contextWindowSize: 128000,
      },
      {
        id: 'moonshotai/Kimi-K2-Instruct-0905',
        contextWindowSize: 262144,
      },
    ]);
  });

  it('is registered and discoverable in the provider registry', () => {
    expect(findProviderById('ionet')).toBe(ionetProvider);
    expect(ALL_PROVIDERS).toContain(ionetProvider);
    expect(THIRD_PARTY_PROVIDERS).toContain(ionetProvider);
    expect(getAllProviderBaseUrls()).toContain(
      'https://api.intelligence.io.solutions/api/v1',
    );
  });

  it('is found by its env key + base URL credentials', () => {
    expect(
      findProviderByCredentials(
        'https://api.intelligence.io.solutions/api/v1',
        'IONET_API_KEY',
      )?.id,
    ).toBe('ionet');
    // Wrong base URL for the right key must not match.
    expect(
      findProviderByCredentials(
        'https://wrong.example.com/v1',
        'IONET_API_KEY',
      ),
    ).toBeUndefined();
  });

  it('creates an install plan with per-model metadata for known IDs', () => {
    const plan = buildInstallPlan(ionetProvider, {
      baseUrl: 'https://api.intelligence.io.solutions/api/v1',
      apiKey: 'ionet-key',
      modelIds: [
        'openai/gpt-oss-120b',
        'zai-org/GLM-4.6',
        'deepseek-ai/DeepSeek-V4.1-Flash',
      ],
    });

    expect(plan.env).toEqual({ IONET_API_KEY: 'ionet-key' });

    const models = plan.modelProviders?.[0]?.models;
    expect(models).toHaveLength(3);
    expect(models?.[0]).toMatchObject({
      id: 'openai/gpt-oss-120b',
      name: '[IO Intelligence] openai/gpt-oss-120b',
      baseUrl: 'https://api.intelligence.io.solutions/api/v1',
      envKey: 'IONET_API_KEY',
    });
    // Standard OpenAI format: only the context window, no extra_body.
    expect(models?.[0]?.generationConfig).toEqual({
      contextWindowSize: 131072,
    });
    expect(models?.[1]?.generationConfig).toEqual({
      contextWindowSize: 131072,
    });
    expect(models?.[2]).toMatchObject({
      id: 'deepseek-ai/DeepSeek-V4.1-Flash',
      name: '[IO Intelligence] deepseek-ai/DeepSeek-V4.1-Flash',
    });
  });

  it('falls back gracefully for unknown model IDs', () => {
    const plan = buildInstallPlan(ionetProvider, {
      baseUrl: 'https://api.intelligence.io.solutions/api/v1',
      apiKey: 'ionet-key',
      modelIds: ['openai/gpt-oss-120b', 'qwen/future-model'],
    });

    const models = plan.modelProviders?.[0]?.models;
    expect(models).toHaveLength(2);
    expect(models?.[1]).toMatchObject({
      id: 'qwen/future-model',
      name: '[IO Intelligence] qwen/future-model',
    });
    expect(models?.[1]?.generationConfig).toBeUndefined();
  });
});
