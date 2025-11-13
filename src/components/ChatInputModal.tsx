import { useEffect, useRef } from 'react';

interface ChatInputModalProps {
	isOpen: boolean;
	onSend: (message: string) => void;
	onClose: () => void;
}

export function ChatInputModal({ isOpen, onSend, onClose }: ChatInputModalProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	const handleSubmit = () => {
		const text = inputRef.current?.value.trim();
		if (text) {
			onSend(text);
			if (inputRef.current) {
				inputRef.current.value = '';
			}
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<input
			ref={inputRef}
			type="text"
			placeholder="Type a message..."
			maxLength={200}
			onKeyDown={handleKeyDown}
			onBlur={onClose}
			style={{
				padding: '6px 10px',
				fontSize: '14px',
				borderRadius: '6px',
				border: '1px solid rgba(100, 180, 255, 0.5)',
				backgroundColor: 'rgba(255, 255, 255, 0.95)',
				color: '#333',
				minWidth: '200px',
			}}
		/>
	);
}
