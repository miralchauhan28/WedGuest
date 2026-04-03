import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App.jsx';

describe('App Component', () => {
  it('renders welcome text', () => {
    render(<App />);
    const heading = screen.getByText(/Welcome!/i);
    expect(heading).toBeInTheDocument();
  });
});