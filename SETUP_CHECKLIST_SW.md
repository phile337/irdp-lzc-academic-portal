# IRDP Notes & Past Papers — Orodha ya maandalizi (Kiswahili)

## Kabla ya kuanza

- [ ] Pakua na fungua ZIP.
- [ ] Usitumie taarifa halisi za wanafunzi wakati backend haijasanidiwa.
- [ ] Pata ruhusa ya matumizi ya jina/nembo ya IRDP.
- [ ] Pata orodha rasmi ya programmes, course codes, academic years, year of study na semesters.
- [ ] Thibitisha kwa IRDP namna sahihi ya kuhakiki namba ya usajili.

## Backend na database

1. Tengeneza project mpya kwenye Supabase.
2. Fungua SQL Editor.
3. Fungua faili `supabase/schema.sql`, nakili SQL yote na uikague kabla ya kuendesha.
4. Endesha SQL kwenye project mpya. Ikiwa kuna error, usiendelee kwa kubahatisha; hifadhi error na urekebishe.
5. Kwenye Supabase project settings, pata Project URL na public anon/publishable key.
6. Fungua `config.js` na ujaze `SUPABASE_URL` na `SUPABASE_ANON_KEY`.
7. Usitumie service-role key kwenye `config.js`, JavaScript ya browser, au kwenye ZIP.
8. Tengeneza admin wa kwanza kwa utaratibu unaodhibitiwa. Usimpe kila mtu ruhusa ya admin.
9. Weka programmes, kozi, semesters na academic years rasmi.
10. Tengeneza akaunti za walimu na teaching assignments kupitia njia salama ya admin.

## Uthibitishaji wa wanafunzi

- Mwanafunzi atatuma jina, namba ya usajili, email, ngazi, programme na mwaka wa masomo.
- Admin lazima alinganishe taarifa na chanzo rasmi cha IRDP.
- Orodha ya maombi inapaswa kuonekana kwa admin tu.
- Akaunti ya mwanafunzi iundwe/iwashwe baada ya uthibitishaji.
- Hati hii haijajumuisha automation salama ya kuidhinisha na kuunda akaunti; hilo linahitaji server-side workflow/Edge Function au mchakato wa admin uliodhibitiwa.
- Usitume nenosiri la muda kupitia fomu ya wazi. Tumia invitation/password reset salama.

## Majaribio yanayotakiwa

- [ ] Mgeni asiweze kusoma notes za ndani.
- [ ] Mwanafunzi asiyeidhinishwa asiweze kuingia.
- [ ] Mwanafunzi aone nyenzo zilizochapishwa za programme yake pekee.
- [ ] Mwanafunzi asiweze kufikia faili kwa kunakili direct URL bila ruhusa.
- [ ] Mwalimu aone kozi alizopangiwa pekee.
- [ ] Mwalimu asiweze kupakia au kuhariri kozi isiyompangiwa.
- [ ] Mwalimu aweze kuchapisha nyenzo moja kwa moja kwa kozi alizopangiwa.
- [ ] Admin aweze kuficha nyenzo.
- [ ] Faili zisizoruhusiwa na mafaili makubwa zizuiwe.
- [ ] RLS na storage policies zikaguliwe kwa akaunti zote tatu.
- [ ] Backup na kurejesha data vijaribiwe.

## Netlify

1. Baada ya backend kuunganishwa na majaribio kupita, deploy folder yenye `index.html`, `styles.css`, `app.js`, `config.js`, `manifest.webmanifest` na `netlify.toml`.
2. Kumbuka `config.js` ina public anon key tu. Usihifadhi siri kwenye frontend.
3. Deploy ya static pekee si mfumo kamili wa production.
4. Usitangaze kuwa mfumo umeidhinishwa rasmi na IRDP mpaka idhini ipatikane.

## Mambo ambayo bado yanahitaji taarifa rasmi

- Nembo sahihi na ruhusa ya kuitumia.
- Orodha ya programmes/kozi/course codes.
- Muundo wa academic year na semester.
- Njia rasmi ya uthibitishaji wa namba ya usajili.
- Wamiliki wa admin access.
- Ruhusa na copyright za notes na past papers.
- Sera ya faragha, kuhifadhi data na backup.
- Domain rasmi, ikiwa chuo kitaidhinisha.
