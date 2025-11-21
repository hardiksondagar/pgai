import React, { useState } from 'react';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating && !disabled) {
      onGenerate(prompt);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating && !disabled) {
        onGenerate(prompt);
        setPrompt('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-stretch gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Select a connection first..." : "Ask AI to write SQL..."}
          disabled={disabled || isGenerating}
          className="flex-1 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating || disabled}
          className={`px-5 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[44px] ${
            disabled || !prompt.trim() || isGenerating
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
          title={isGenerating ? 'Generating...' : 'Send (Enter)'}
        >
          {isGenerating ? (
            <span className="text-xl">⏳</span>
          ) : (
            <span className="text-xl">🚀</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default PromptInput;

