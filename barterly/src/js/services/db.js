// Mock persistence, scoped per account. Replaced by the real backend later.
import { read, write } from '../util.js';
import { makeListings, seedMine, seedChats, DEMO } from '../data/mock.js';

export const market = makeListings();

let key = null;
let data = null;

export function loadUserData(account) {
  key = `barterly:v1:${account.email}`;
  data = read(key, null);
  if (!data) {
    const demo = account.email === DEMO.email;
    data = {
      profile: {
        username: account.username, legalName: 'Not Verified Yet', isVerified: false, idType: '',
        rating: demo ? 4.9 : 0, tradesCount: demo ? 14 : 0, photo: demo ? 'https://randomuser.me/api/portraits/men/32.jpg' : '',
        strikes: 0, flagged: false, name: account.name,
      },
      mine: demo ? seedMine(account.username) : [],
      chats: demo ? seedChats() : [],
      saved: [],
    };
    commit();
  }
  return data;
}

export const db = () => data;
export function commit() { if (key) write(key, data); }
export function unloadUserData() { key = null; data = null; }
