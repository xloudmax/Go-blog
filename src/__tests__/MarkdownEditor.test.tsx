import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../components/ThemeProvider';
import MarkdownEditor from '../components/MarkdownEditor';

// Mock the @uiw/react-md-editor component
vi.mock('@uiw/react-md-editor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => (
    <textarea
      data-testid="mock-md-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock Ant Design components
vi.mock('antd', () => ({
  Card: ({ children, className, styles }: any) => (
    <div className={className} data-testid="card">
      <div style={styles?.body}>{children}</div>
    </div>
  ),
  Button: ({ children, onClick, loading, icon }: any) => (
    <button onClick={onClick} disabled={loading} data-testid="button">
      {icon}
      {children}
    </button>
  ),
  Space: ({ children }: any) => <div data-testid="space">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  notification: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  Modal: {
    confirm: vi.fn(),
  },
}));

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  SaveOutlined: () => <span data-testid="save-icon">Save</span>,
  EyeOutlined: () => <span data-testid="eye-icon">Eye</span>,
  FullscreenOutlined: () => <span data-testid="fullscreen-icon">Fullscreen</span>,
  FullscreenExitOutlined: () => <span data-testid="fullscreen-exit-icon">Exit Fullscreen</span>,
  HistoryOutlined: () => <span data-testid="history-icon">History</span>,
  CheckCircleOutlined: () => <span data-testid="check-circle-icon">Check</span>,
  ExclamationCircleOutlined: () => <span data-testid="exclamation-circle-icon">!</span>,
}));

describe('MarkdownEditor Component Tests', () => {
  const mockOnSave = vi.fn();

  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fullscreen API
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with initial value', () => {
    const initialValue = '# Hello World';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    const editor = screen.getByTestId('mock-md-editor');
    expect(editor).toBeInTheDocument();
    expect((editor as HTMLTextAreaElement).value).toBe(initialValue);
  });

  it('should update value when editor content changes', () => {
    const initialValue = '# Hello World';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: '# Updated Content' } });

    expect((editor as HTMLTextAreaElement).value).toBe('# Updated Content');
  });

  it('should show dirty state when content changes', () => {
    const initialValue = '# Hello World';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Initially should not be dirty
    expect(screen.queryByText('● 有未保存的更改')).not.toBeInTheDocument();

    // Change content
    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: '# Updated Content' } });

    // Should show dirty state
    expect(screen.getByText('● 有未保存的更改')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const initialValue = '# Hello World';
    const updatedValue = '# Updated Content';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Change content
    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: updatedValue } });

    // Click save button
    const saveButton = screen.getByText('保存').closest('button')!;
    fireEvent.click(saveButton);

    // Should show confirmation modal
    expect(screen.getByText('确认保存')).toBeInTheDocument();

    // Mock the modal confirm function to call the onOk callback
    const modalConfirm = vi.mocked(await import('antd')).Modal.confirm;
    const onOk = modalConfirm.mock.calls[0][0].onOk as () => void;
    await onOk();

    // Should call onSave with updated value
    expect(mockOnSave).toHaveBeenCalledWith(updatedValue);
  });

  it('should show success message after saving', async () => {
    const initialValue = '# Hello World';
    const updatedValue = '# Updated Content';
    
    mockOnSave.mockResolvedValueOnce(undefined);

    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Change content
    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: updatedValue } });

    // Click save button
    const saveButton = screen.getByText('保存').closest('button')!;
    fireEvent.click(saveButton);

    // Mock the modal confirm function to call the onOk callback
    const modalConfirm = vi.mocked(await import('antd')).Modal.confirm;
    const onOk = modalConfirm.mock.calls[0][0].onOk as () => void;
    await onOk();

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/已保存/)).toBeInTheDocument();
    });
  });

  it('should handle save error', async () => {
    const initialValue = '# Hello World';
    const updatedValue = '# Updated Content';
    const errorMessage = '保存失败，请重试';
    
    mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Change content
    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: updatedValue } });

    // Click save button
    const saveButton = screen.getByText('保存').closest('button')!;
    fireEvent.click(saveButton);

    // Mock the modal confirm function to call the onOk callback
    const modalConfirm = vi.mocked(await import('antd')).Modal.confirm;
    const onOk = modalConfirm.mock.calls[0][0].onOk as () => void;
    await onOk();

    // Should show error message
    await waitFor(async () => {
      const antd = await import('antd');
      expect(antd.notification.error).toHaveBeenCalledWith(expect.objectContaining({
        message: '保存失败',
        description: errorMessage,
      }));
    });
  });

  it('should handle keyboard shortcut (Ctrl+S)', () => {
    const initialValue = '# Hello World';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Change content to make it dirty
    const editor = screen.getByTestId('mock-md-editor');
    fireEvent.change(editor, { target: { value: '# Updated Content' } });

    // Simulate Ctrl+S
    fireEvent.keyDown(document, { ctrlKey: true, key: 's' });

    // Should show confirmation modal
    expect(screen.getByText('确认保存')).toBeInTheDocument();
  });

  it('should toggle fullscreen mode', async () => {
    const initialValue = '# Hello World';
    
    // Mock requestFullscreen
    const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    Element.prototype.requestFullscreen = mockRequestFullscreen;

    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Click fullscreen button
    const fullscreenButton = screen.getByText('Fullscreen').closest('button')!;
    fireEvent.click(fullscreenButton);

    // Should call requestFullscreen
    expect(mockRequestFullscreen).toHaveBeenCalled();
  });

  it('should show character count', () => {
    const initialValue = '# Hello World';
    
    renderWithTheme(
      <MarkdownEditor initialValue={initialValue} onSave={mockOnSave} />
    );

    // Should show character count
    expect(screen.getByText(`字数: ${initialValue.length}`)).toBeInTheDocument();
  });
});
