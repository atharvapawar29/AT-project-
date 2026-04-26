import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/GraphvizViewer', () => () => null);
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => <div>{children}</div>,
    NavLink: ({ children }) => <span>{children}</span>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: ({ element }) => <>{element}</>,
    Link: ({ children }) => <span>{children}</span>,
  };
}, { virtual: true });

test('renders regex lab title', () => {
  render(<App />);
  const linkElement = screen.getByText(/Regex to DFA Visual Simulator/i);
  expect(linkElement).toBeInTheDocument();
});
