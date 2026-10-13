import { chats } from '../services/chats.js';
import { avatar, img, emptyState, verifiedMark } from '../components/ui.js';
import { timeAgo, esc } from '../util.js';

export const title = () => 'Chats';

const row = (c, i) => {
  const last = c.messages[c.messages.length - 1];
  const statusPill = c.status === 'swapped' ? '<span class="pill pill-success">Swapped</span>'
    : c.status === 'disputed' ? '<span class="pill pill-warn">Dispute</span>' : '';
  return `<a href="#/chats/${esc(c.id)}" class="inbox-row reveal ${c.unread ? 'unread' : ''}" style="--i:${i}" aria-label="Chat with ${esc(c.partner)} about ${esc(c.itemTitle)}${c.unread ? ', unread' : ''}">
    <span class="thumb">${avatar(c.partnerPhoto, c.partner, 52)}${img({ src: c.itemImage, alt: '', cls: 'mini', label: 'Others' })}</span>
    <span class="grow">
      <span class="row between" style="gap:8px"><b class="truncate row" style="gap:4px">${esc(c.partner)} ${c.verified ? verifiedMark(13) : ''}</b><span class="t-caption t-muted" style="flex:none">${timeAgo(c.updatedAt)}</span></span>
      <span class="t-caption t-brand truncate" style="display:block;font-weight:600">${esc(c.itemTitle)}</span>
      <span class="row between" style="gap:8px"><span class="preview t-small t-muted truncate">${last ? (last.sender === 'me' ? 'You: ' : '') + esc(last.text) : 'No messages yet'}</span>
        ${c.unread ? `<span class="badge">${c.unread}</span>` : statusPill}</span>
    </span></a>`;
};

export async function render() {
  const list = await chats.list();
  return `
  <header class="topbar"><h1 class="title grow">Chats</h1></header>
  <div class="pad stack" style="--gap:10px;padding-top:4px">
    ${list.length ? list.map(row).join('') : emptyState({ icon: 'chat', title: 'No conversations yet', text: 'Find something you like and propose a swap to start chatting.', action: { label: 'Browse swaps', attrs: 'data-action="go" data-to="/home"' } })}
  </div>`;
}
