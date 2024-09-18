import { GoogleGenerativeAI } from "@google/generative-ai";

class UnifiedAI {
  constructor(config) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
    this.conversationHistory = [];
    this.extraParams = config.extraParams || {};
    this.genAI = null;
    this.modelInstance = null;
  }

  async initialize() {
    switch (this.provider) {
      case 'openai':
        return this.initializeOpenAI();
      case 'anthropic':
        return this.initializeAnthropic();
      case 'togetherai':
        return this.initializeTogetherAI();
      case 'gemini':
        return this.initializeGemini();
      default:
        throw new Error('Unsupported provider');
    }
  }

  async sendMessage(message) {
    this.conversationHistory.push({ role: "user", content: message });
    
    switch (this.provider) {
      case 'openai':
        return this.sendOpenAI(message);
      case 'anthropic':
        return this.sendAnthropic(message);
      case 'togetherai':
        return this.sendTogetherAI(message);
      case 'gemini':
        return this.sendGemini(message);
      default:
        throw new Error('Unsupported provider');
    }
  }

  async initializeOpenAI() {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) throw new Error('Invalid API key');
    } catch (error) {
      throw new Error('Failed to initialize OpenAI API: ' + error.message);
    }
  }

  async sendOpenAI(message) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.conversationHistory,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          ...this.extraParams
        })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      throw new Error('OpenAI API request failed: ' + error.message);
    }
  }

  async initializeAnthropic() {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-beta': 'messages-2023-12-15',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: "user", content: "Test" }]
        })
      });
      if (!response.ok) throw new Error('Invalid API key');
    } catch (error) {
      throw new Error('Failed to initialize Anthropic API: ' + error.message);
    }
  }

  async sendAnthropic(message) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-beta': 'messages-2023-12-15',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: this.conversationHistory,
          ...this.extraParams
        })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const assistantMessage = data.content[0].text;
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      throw new Error('Anthropic API request failed: ' + error.message);
    }
  }

  async initializeTogetherAI() {
    try {
      const response = await fetch('https://api.together.xyz/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) throw new Error('Invalid API key');
    } catch (error) {
      throw new Error('Failed to initialize TogetherAI API: ' + error.message);
    }
  }

  async sendTogetherAI(message) {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.conversationHistory,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          ...this.extraParams
        })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      throw new Error('TogetherAI API request failed: ' + error.message);
    }
  }

  async initializeGemini() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.modelInstance = this.genAI.getGenerativeModel({ model: this.model });
    } catch (error) {
      throw new Error('Failed to initialize Gemini API: ' + error.message);
    }
  }

  async sendGemini(message) {
    try {
      const chat = this.modelInstance.startChat({
        history: this.conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          ...this.extraParams
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const assistantMessage = response.text();
      this.conversationHistory.push({ role: "model", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      throw new Error('Gemini API request failed: ' + error.message);
    }
  }
}

if (typeof window !== 'undefined') {
  window.UnifiedAI = UnifiedAI;
}

export default UnifiedAI;