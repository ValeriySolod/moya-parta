'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { chatApi, type ChatContact, type ChatMessageView } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/lib/format';
import styles from './ChatPanel.module.css';

type Tab = 'class' | 'direct';

type ChatPanelProps = {
  compact?: boolean;
};

export function ChatPanel({ compact = false }: ChatPanelProps) {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>('class');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const classQuery = useQuery({
    queryKey: ['chat-class'],
    queryFn: chatApi.getClassChat,
    refetchInterval: 4000,
  });

  const contactsQuery = useQuery({
    queryKey: ['chat-contacts'],
    queryFn: chatApi.getContacts,
    refetchInterval: 5000,
  });

  const directQuery = useQuery({
    queryKey: ['chat-direct', selectedContactId],
    queryFn: () => chatApi.getDirect(selectedContactId!),
    enabled: Boolean(selectedContactId),
    refetchInterval: 3000,
  });

  const selectedContact = contactsQuery.data?.find(
    (item) => item.id === selectedContactId,
  );

  const sendClass = useMutation({
    mutationFn: (text: string) => chatApi.sendClassMessage(text),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['chat-class'] });
    },
  });

  const sendDirect = useMutation({
    mutationFn: (text: string) =>
      chatApi.sendDirect(selectedContactId!, text),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({
        queryKey: ['chat-direct', selectedContactId],
      });
      void queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
  });

  const messages: ChatMessageView[] =
    tab === 'class' ? (classQuery.data ?? []) : (directQuery.data ?? []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, tab, selectedContactId]);

  if (classQuery.isLoading || contactsQuery.isLoading) {
    return <LoadingState label="Відкриваємо чат..." />;
  }

  const onSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (tab === 'class') {
      sendClass.mutate(text);
      return;
    }

    if (selectedContactId) {
      sendDirect.mutate(text);
    }
  };

  return (
    <div className={`${styles.page} ${compact ? styles.compact : ''}`}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'class' ? styles.tabActive : ''}`}
          onClick={() => setTab('class')}
        >
          Клас
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'direct' ? styles.tabActive : ''}`}
          onClick={() => setTab('direct')}
        >
          Особисті
        </button>
      </div>

      {tab === 'direct' ? (
        <div className={styles.layout}>
          <aside className={styles.contacts}>
            {!compact ? <h2>Кому написати</h2> : null}
            {(contactsQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="Поки нікого немає"
                description="Коли в класі зʼявляться друзі — тут можна буде писати."
              />
            ) : (
              contactsQuery.data?.map((contact) => (
                <ContactButton
                  key={contact.id}
                  contact={contact}
                  active={contact.id === selectedContactId}
                  onClick={() => setSelectedContactId(contact.id)}
                />
              ))
            )}
          </aside>

          <section className={styles.thread}>
            {!selectedContact ? (
              <EmptyState
                title="Обери, кому написати"
                description="Особисте повідомлення побачите лише ви двоє."
              />
            ) : (
              <>
                <header className={styles.threadHead}>
                  <Avatar
                    emoji={selectedContact.avatarEmoji}
                    color={selectedContact.avatarColor}
                    size="sm"
                  />
                  <div>
                    <strong>{selectedContact.displayName}</strong>
                    <span>
                      {selectedContact.role === 'teacher'
                        ? 'Учитель'
                        : 'Однокласник'}
                    </span>
                  </div>
                </header>
                <MessageList
                  messages={messages}
                  currentUserId={user?.id}
                  listRef={listRef}
                />
                <Composer
                  draft={draft}
                  setDraft={setDraft}
                  onSend={onSend}
                  pending={sendDirect.isPending}
                  placeholder={`Написати ${selectedContact.displayName}...`}
                />
              </>
            )}
          </section>
        </div>
      ) : (
        <section className={styles.threadSolo}>
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            listRef={listRef}
            emptyTitle="Чат класу ще тихий"
            emptyDescription="Напиши першим — усі в класі побачать."
          />
          <Composer
            draft={draft}
            setDraft={setDraft}
            onSend={onSend}
            pending={sendClass.isPending}
            placeholder="Повідомлення для всього класу..."
          />
        </section>
      )}
    </div>
  );
}

function ContactButton({
  contact,
  active,
  onClick,
}: {
  contact: ChatContact;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.contact} ${active ? styles.contactActive : ''}`}
      onClick={onClick}
    >
      <Avatar
        emoji={contact.avatarEmoji}
        color={contact.avatarColor}
        size="sm"
      />
      <div className={styles.contactText}>
        <strong>{contact.displayName}</strong>
        <span>
          {contact.lastMessage?.text ??
            (contact.role === 'teacher' ? 'Учитель' : 'Однокласник')}
        </span>
      </div>
    </button>
  );
}

function MessageList({
  messages,
  currentUserId,
  listRef,
  emptyTitle = 'Поки немає повідомлень',
  emptyDescription = 'Напиши першим.',
}: {
  messages: ChatMessageView[];
  currentUserId?: string;
  listRef: RefObject<HTMLDivElement | null>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (messages.length === 0) {
    return (
      <div className={styles.messages}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={styles.messages} ref={listRef}>
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        return (
          <div
            key={message.id}
            className={`${styles.bubbleWrap} ${mine ? styles.mine : ''}`}
          >
            {!mine ? (
              <Avatar
                emoji={message.sender?.avatarEmoji ?? '🙂'}
                color={message.sender?.avatarColor ?? '#B8DDF5'}
                size="sm"
              />
            ) : null}
            <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
              {!mine ? (
                <div className={styles.sender}>{message.sender?.displayName}</div>
              ) : null}
              <p>{message.text}</p>
              <time>{formatRelativeTime(message.createdAt)}</time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  onSend,
  pending,
  placeholder,
}: {
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  placeholder: string;
}) {
  return (
    <div className={styles.composer}>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <Button size="md" onClick={onSend} disabled={!draft.trim() || pending}>
        Надіслати
      </Button>
    </div>
  );
}
