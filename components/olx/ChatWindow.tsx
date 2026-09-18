"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Send,
	Sparkles,
	Zap,
	Star,
	Archive,
	ExternalLink,
	Loader2,
	CheckCheck,
	ShoppingBag,
} from "lucide-react";
import type { ThreadItem } from "./ThreadList";
import { QuickTemplatesModal, type Template } from "./QuickTemplatesModal";

export type MessageItem = {
	id: string;
	olxMessageId?: string | null;
	threadId: string;
	senderName?: string | null;
	isFromMe: boolean;
	text: string;
	attachments?: string[];
	isRead: boolean;
	sentAt: string;
};

type ChatWindowProps = {
	thread: ThreadItem | null;
	onSendMessage: (text: string, attachments?: string[]) => Promise<void>;
	onToggleFavorite: (id: string, current: boolean) => void;
	onToggleArchive: (id: string, current: boolean) => void;
	onOpenProductSidebar?: () => void;
	isSending: boolean;
};

export function ChatWindow({
	thread,
	onSendMessage,
	onToggleFavorite,
	onToggleArchive,
	onOpenProductSidebar,
	isSending,
}: ChatWindowProps) {
	const [messages, setMessages] = useState<MessageItem[]>([]);
	const [inputText, setInputText] = useState("");
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
	const [isAiGenerating, setIsAiGenerating] = useState(false);
	const [quickTemplates, setQuickTemplates] = useState<Template[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Загрузка сообщений при смене активного треда
	const fetchMessages = async (threadId: string) => {
		setLoadingMessages(true);
		try {
			const res = await fetch(`/api/olx/threads/${threadId}/messages`);
			const data = await res.json();
			if (Array.isArray(data)) {
				setMessages(data);
			}

			// Отмечаем прочитанным
			await fetch(`/api/olx/threads/${threadId}/read`, { method: "POST" });
		} catch (err) {
			console.error("Failed to fetch messages:", err);
		} finally {
			setLoadingMessages(false);
		}
	};

	// Загрузка быстрых шаблонов
	const fetchTemplates = async () => {
		try {
			const res = await fetch("/api/olx/templates");
			const data = await res.json();
			if (Array.isArray(data)) {
				setQuickTemplates(data);
			}
		} catch (e) {
			console.error(e);
		}
	};

	useEffect(() => {
		fetchTemplates();
	}, []);

	useEffect(() => {
		if (thread?.id) {
			fetchMessages(thread.id);
		} else {
			setMessages([]);
		}
	}, [thread?.id]);

	// Автоскролл к последнему сообщению
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loadingMessages]);

	const handleSend = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!inputText.trim() || isSending) return;

		const textToSend = inputText.trim();
		setInputText("");

		// Оптимистичное добавление сообщения в UI
		const tempMsg: MessageItem = {
			id: "temp_" + Date.now(),
			threadId: thread?.id || "",
			isFromMe: true,
			senderName: "Вы",
			text: textToSend,
			isRead: false,
			sentAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, tempMsg]);

		try {
			await onSendMessage(textToSend);
			if (thread?.id) {
				fetchMessages(thread.id);
			}
		} catch (err) {
			console.error("Send error:", err);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	// AI генерация ответа
	const handleGenerateAiReply = async (promptCustom?: string) => {
		if (!thread?.id || isAiGenerating) return;
		setIsAiGenerating(true);

		try {
			const res = await fetch("/api/olx/ai/suggest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					threadId: thread.id,
					prompt: promptCustom || "",
					tone: "friendly",
				}),
			});

			const data = await res.json();
			if (data.suggestion) {
				setInputText(data.suggestion);
				textareaRef.current?.focus();
			}
		} catch (err) {
			console.error("AI reply error:", err);
		} finally {
			setIsAiGenerating(false);
		}
	};

	if (!thread) {
		return (
			<div className="flex flex-col items-center justify-center h-full bg-card/60 rounded-2xl border border-border/40 p-8 text-center backdrop-blur-md shadow-lg">
				<div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
					<ShoppingBag className="w-8 h-8" />
				</div>
				<h3 className="text-lg font-bold text-foreground">
					Выберите диалог для общения
				</h3>
				<p className="text-xs text-muted-foreground max-w-sm mt-1">
					Выберите переписку из списка слева, чтобы отвечать покупателям OLX,
					генерировать AI ответы и оформлять заказы
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-card/60 rounded-2xl border border-border/40 overflow-hidden shadow-lg backdrop-blur-md relative">
			{/* Шапка чата */}
			<div className="p-3.5 px-4 border-b border-border/30 flex items-center justify-between gap-3 bg-card/80">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
						{(thread.interlocutorName || "П").slice(0, 1).toUpperCase()}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-sm text-foreground truncate">
								{thread.interlocutorName || "Покупатель OLX"}
							</h3>
							{thread.account && (
								<Badge
									variant="outline"
									className="text-[10px] py-0 px-1.5 bg-foreground/5 border-border/30"
								>
									{thread.account.accountName}
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-2 text-xs text-muted-foreground truncate mt-0.5">
							<span className="text-primary font-medium truncate">
								{thread.advertTitle || "Объявление OLX"}
							</span>
							{thread.advertPrice && (
								<span className="font-bold text-foreground shrink-0">
									• {thread.advertPrice} ₴
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5 shrink-0">
					{thread.advertUrl && (
						<a
							href={thread.advertUrl}
							target="_blank"
							rel="noreferrer"
							className="p-2 rounded-xl hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
							title="Открыть объявление на OLX"
						>
							<ExternalLink className="w-4 h-4" />
						</a>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={() => onToggleFavorite(thread.id, thread.isFavorite)}
						className="h-9 w-9 rounded-xl hover:bg-foreground/5"
						title={thread.isFavorite ? "Убрать из избранного" : "В избранное"}
					>
						<Star
							className={`w-4 h-4 ${
								thread.isFavorite
									? "text-amber-400 fill-amber-400"
									: "text-muted-foreground"
							}`}
						/>
					</Button>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => onToggleArchive(thread.id, thread.isArchived)}
						className="h-9 w-9 rounded-xl hover:bg-foreground/5"
						title={thread.isArchived ? "Разархивировать" : "В архив"}
					>
						<Archive
							className={`w-4 h-4 ${
								thread.isArchived ? "text-primary" : "text-muted-foreground"
							}`}
						/>
					</Button>

					{onOpenProductSidebar && (
						<Button
							variant="outline"
							size="sm"
							onClick={onOpenProductSidebar}
							className="md:hidden h-8 px-2 rounded-xl text-xs font-bold gap-1"
						>
							<ShoppingBag className="w-3.5 h-3.5" /> Товар
						</Button>
					)}
				</div>
			</div>

			{/* Окно сообщений */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{loadingMessages ? (
					<div className="flex items-center justify-center h-full text-muted-foreground gap-2">
						<Loader2 className="w-5 h-5 animate-spin text-primary" />
						<span className="text-xs font-semibold">Загрузка переписки...</span>
					</div>
				) : messages.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground space-y-1">
						<p className="text-xs font-semibold">История сообщений пуста</p>
						<p className="text-[11px] opacity-70">
							Напишите первое сообщение покупателю ниже
						</p>
					</div>
				) : (
					messages.map((msg, index) => {
						const isMe = msg.isFromMe;
						const timeStr = new Date(msg.sentAt).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						});

						return (
							<div
								key={msg.id || index}
								className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
							>
								<div
									className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl shadow-sm text-xs sm:text-sm leading-relaxed ${
										isMe
											? "bg-primary text-primary-foreground rounded-br-xs shadow-primary/10"
											: "bg-foreground/10 text-foreground rounded-bl-xs border border-border/30"
									}`}
								>
									{/* Текст сообщения */}
									<p className="whitespace-pre-wrap wrap-break-word">
										{msg.text}
									</p>

									{/* Вложения если есть */}
									{msg.attachments && msg.attachments.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mt-2">
											{msg.attachments.map((att, i) => (
												<a key={i} href={att} target="_blank" rel="noreferrer">
													<img
														src={att}
														alt="Attachment"
														className="w-24 h-24 object-cover rounded-xl border border-white/20 hover:scale-105 transition-transform"
													/>
												</a>
											))}
										</div>
									)}

									{/* Время и статус */}
									<div
										className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
											isMe
												? "text-primary-foreground/75"
												: "text-muted-foreground"
										}`}
									>
										<span>{timeStr}</span>
										{isMe && (
											<CheckCheck className="w-3 h-3 text-primary-foreground/90" />
										)}
									</div>
								</div>
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Панель быстрых шаблонов и AI-генератора */}
			<div className="p-2 border-t border-border/20 bg-background/50 flex items-center justify-between gap-2 overflow-x-auto">
				<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
					{/* AI Кнопка */}
					<Button
						size="sm"
						variant="outline"
						onClick={() => handleGenerateAiReply()}
						disabled={isAiGenerating}
						className="h-8 px-2.5 rounded-xl bg-linear-to-r from-violet-600/15 to-indigo-600/15 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400 hover:text-indigo-300 text-xs font-bold gap-1.5 shrink-0 transition-all shadow-sm"
						title="Сгенерировать вежливый ответ через AI Copilot"
					>
						{isAiGenerating ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
						)}
						<span>AI Ответ</span>
					</Button>

					{/* Кнопка открытия всех шаблонов */}
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsTemplatesOpen(true)}
						className="h-8 px-2.5 rounded-xl border-border/40 hover:bg-foreground/10 text-xs font-bold gap-1.5 shrink-0"
					>
						<Zap className="w-3.5 h-3.5 text-amber-400" />
						<span>Шаблоны</span>
					</Button>

					{/* Быстрые чипы топ-3 шаблонов */}
					{quickTemplates.slice(0, 3).map((tpl) => (
						<button
							key={tpl.id}
							type="button"
							onClick={() => {
								setInputText(tpl.text);
								textareaRef.current?.focus();
							}}
							className="h-8 px-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground text-[11px] font-semibold truncate max-w-35 transition-all border border-border/20 shrink-0"
						>
							{tpl.title}
						</button>
					))}
				</div>
			</div>

			{/* Поле ввода сообщения */}
			<form
				onSubmit={handleSend}
				className="p-3 bg-card/90 border-t border-border/30 flex items-end gap-2"
			>
				<div className="flex-1 relative">
					<Textarea
						ref={textareaRef}
						placeholder="Напишите сообщение покупателю (Enter — отправить, Shift+Enter — перенос)..."
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						onKeyDown={handleKeyDown}
						rows={2}
						className="w-full bg-foreground/5 border-none resize-none text-xs sm:text-sm rounded-xl py-2 pl-3 pr-3 focus:ring-1 focus:ring-primary/30 min-h-11 max-h-30"
					/>
				</div>

				<Button
					type="submit"
					disabled={!inputText.trim() || isSending}
					className="h-11 w-11 rounded-xl font-bold shadow-lg shadow-primary/20 shrink-0 flex items-center justify-center p-0"
				>
					{isSending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
				</Button>
			</form>

			{/* Модальное окно шаблонов */}
			<QuickTemplatesModal
				isOpen={isTemplatesOpen}
				onClose={() => setIsTemplatesOpen(false)}
				onSelectTemplate={(text) => {
					setInputText(text);
					textareaRef.current?.focus();
				}}
			/>
		</div>
	);
}
