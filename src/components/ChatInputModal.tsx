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
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
			onClick={onClose}
		>
			<div
				style={{
					backgroundColor: '#1a3a52',
					borderRadius: '12px',
					padding: '24px',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
					minWidth: '300px',
					border: '2px solid rgba(100, 180, 255, 0.5)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<h2
					style={{
						color: 'white',
						marginTop: 0,
						marginBottom: '16px',
						fontSize: '18px',
					}}
				>
					Send a message
				</h2>
				<input
					ref={inputRef}
					type="text"
					placeholder="Type your message..."
					maxLength={200}
					onKeyDown={handleKeyDown}
					style={{
						width: '100%',
						padding: '10px',
						fontSize: '14px',
						borderRadius: '6px',
						border: '1px solid rgba(100, 180, 255, 0.5)',
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						color: '#333',
						boxSizing: 'border-box',
						marginBottom: '12px',
					}}
				/>
				<div
					style={{
						display: 'flex',
						gap: '8px',
						justifyContent: 'flex-end',
					}}
				>
					<button
						onClick={onClose}
						style={{
							padding: '8px 16px',
							fontSize: '14px',
							borderRadius: '6px',
							border: '1px solid rgba(100, 180, 255, 0.5)',
							backgroundColor: 'transparent',
							color: 'white',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
						}}
						onMouseEnter={(e) => {
							(e.target as HTMLButtonElement).style.backgroundColor = 'rgba(100, 150, 200, 0.3)';
						}}
						onMouseLeave={(e) => {
							(e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						style={{
							padding: '8px 16px',
							fontSize: '14px',
							borderRadius: '6px',
							border: '1px solid rgba(100, 180, 255, 0.8)',
							backgroundColor: 'rgba(100, 180, 255, 0.6)',
							color: 'white',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							fontWeight: 'bold',
						}}
						onMouseEnter={(e) => {
							(e.target as HTMLButtonElement).style.backgroundColor = 'rgba(100, 180, 255, 0.8)';
						}}
						onMouseLeave={(e) => {
							(e.target as HTMLButtonElement).style.backgroundColor = 'rgba(100, 180, 255, 0.6)';
						}}
					>
						Send
					</button>
				</div>
				<div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
					Press Enter to send or Escape to cancel
				</div>
			</div>
		</div>
	);
}
