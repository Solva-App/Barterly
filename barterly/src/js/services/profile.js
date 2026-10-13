import { request, ApiError } from './api.js';
import { db, commit } from './db.js';
import { store } from '../store.js';

/** 0–100. Verified ID is the biggest lever, then track record and clean standing. */
export function trustScore(p) {
  let s = 30;
  if (p.isVerified) s += 35;
  s += Math.min(20, Math.round(p.tradesCount * 1.2));
  s += p.flagged ? 0 : 15 - p.strikes * 5;
  return Math.max(5, Math.min(100, s));
}

export const profile = {
  verifyIdentity: ({ legalName, idType }) => request({
    method: 'POST', path: '/me/verification', body: { legalName, idType },
    latency: false,
    mock: () => {
      if (!legalName || legalName.trim().length < 3) throw new ApiError('Enter your full legal name.', { field: 'name' });
      const p = db().profile;
      p.legalName = legalName.trim(); p.idType = idType; p.isVerified = true; commit();
      store.set({ profile: { ...p } });
      return p;
    },
  }),
};
