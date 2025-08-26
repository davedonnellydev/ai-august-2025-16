import { render, screen, userEvent } from '@/test-utils';
import { NewDeck } from './NewDeck';

// Mock the ClientRateLimiter
jest.mock('../../app/lib/utils/api-helpers', () => ({
  ClientRateLimiter: {
    getRemainingRequests: jest.fn(() => 10),
    checkLimit: jest.fn(() => true),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('NewDeck component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and buttons', () => {
    render(<NewDeck />);
    expect(screen.getByLabelText('Topic description')).toBeInTheDocument();
    expect(screen.getByText('Generate Deck')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('displays remaining requests count', () => {
    render(<NewDeck />);
    expect(
      screen.getByText(/You have \d+ Deck generations remaining/)
    ).toBeInTheDocument();
  });

  it('allows user to type in input field', async () => {
    const user = userEvent.setup();
    render(<NewDeck />);

    const input = screen.getByLabelText('Topic description');
    await user.type(input, 'Hello world');

    expect(input).toHaveValue('Hello world');
  });

  it('shows error when trying to submit empty input', async () => {
    const user = userEvent.setup();
    render(<NewDeck />);

    const submitButton = screen.getByText('Generate Deck');
    await user.click(submitButton);

    expect(
      screen.getByText('Error: Please enter a description or outline')
    ).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<NewDeck />);

    const input = screen.getByLabelText('Topic description');
    const resetButton = screen.getByText('Reset');

    await user.type(input, 'Test input');
    await user.click(resetButton);

    expect(input).toHaveValue('');
  });
});
