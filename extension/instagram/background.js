// Accueil d'Instagram -> messagerie, avant même que la requête ne parte :
// la page d'accueil n'est jamais téléchargée ni affichée, donc aucun délai
// perceptible (le script de contenu ne sert que pour la navigation interne).
const INBOX = "https://www.instagram.com/direct/inbox/";

browser.webRequest.onBeforeRequest.addListener(
  (details) => (details.method === "GET" ? { redirectUrl: INBOX } : {}),
  {
    urls: [
      "*://www.instagram.com/",
      "*://www.instagram.com/?*",
      "*://instagram.com/",
      "*://instagram.com/?*",
    ],
    types: ["main_frame"],
  },
  ["blocking"]
);
