const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.2 }
);

function registerReveal(el) {
  if (!el) return;
  el.classList.add("reveal");
  observer.observe(el);
}

document.querySelectorAll("section, .hero-card, .panel, .card, .pub").forEach(registerReveal);

const publications = [
  {
    title: "Are crowd-sourced CTI datasets ready for supporting anti-cybercrime intelligence?",
    meta: "Computer Networks - 2023",
    year: 2023,
    citations: 11,
    summary:
      "Assesses whether public cyber-threat-intelligence datasets are mature enough to support operational anti-cybercrime analysis and structured knowledge extraction.",
    highlights: ["Cyber threat intelligence", "Dataset quality", "Operational readiness"],
    href: "https://www.sciencedirect.com/science/article/pii/S1389128623003278",
    weight: 14,
  },
  {
    title: "Using CTI Data to Understand Real World Cyberattacks",
    meta: "WONS - 2023",
    year: 2023,
    citations: 1,
    summary:
      "Shows how curated CTI data can be turned into practical signals for understanding attack campaigns, actor behavior, and incident context.",
    highlights: ["Real-world attacks", "CTI analytics", "Security operations"],
    href: "https://ieeexplore.ieee.org/document/10110366",
    weight: 10,
  },
  {
    title: "Time for Action: Automated Analysis of Cyber Threat Intelligence in the Wild",
    meta: "arXiv preprint - 2023",
    year: 2023,
    citations: 75,
    summary:
      "Builds an automated pipeline for mining large volumes of CTI data in the wild so analysts can extract structure, trends, and actionable patterns faster.",
    highlights: ["Threat intelligence automation", "Large-scale CTI analysis", "Security knowledge extraction"],
    href: "https://arxiv.org/abs/2307.10214",
    weight: 28,
  },
  {
    title: "syslrn: Learning What to Monitor for Efficient Anomaly Detection",
    meta: "EuroMLSys - 2022",
    year: 2022,
    citations: 4,
    summary:
      "Learns compact monitoring strategies so anomaly detection can stay effective without instrumenting every possible system metric.",
    highlights: ["Machine learning systems", "Efficient monitoring", "Anomaly detection"],
    href: "https://openreview.net/forum?id=nM4wrDw2A2",
    weight: 10,
  },
  {
    title: "User Profiling by Network Observers",
    meta: "CoNEXT - 2021",
    year: 2021,
    citations: 12,
    summary:
      "Quantifies how much user-level behavioral profiling remains possible for network observers even after widespread encryption adoption.",
    highlights: ["Encrypted traffic", "Privacy risk", "Network measurement"],
    href: "https://dl.acm.org/doi/10.1145/3485983.3494868",
    weight: 18,
  },
  {
    title: "TRANSREV: Modeling Reviews as Translations from Users to Items",
    meta: "ECIR - 2020",
    year: 2020,
    citations: 31,
    summary:
      "Treats reviews as user-to-item translations to improve recommendation quality and model explainable preference signals from text.",
    highlights: ["Recommendation systems", "Explainability", "Review modeling"],
    href: "https://link.springer.com/chapter/10.1007/978-3-030-45442-5_18",
    weight: 19,
  },
  {
    title: "Answering Visual-Relational Queries in Web-Extracted Knowledge Graphs",
    meta: "AKBC / arXiv - 2019",
    year: 2019,
    citations: 47,
    summary:
      "Combines visual and relational signals to answer queries over large knowledge graphs enriched with images from the web.",
    highlights: ["Knowledge graphs", "Visual reasoning", "Multimodal learning"],
    href: "https://arxiv.org/abs/1904.04950",
    weight: 22,
  },
  {
    title: "Poster: On the Application of NLP to Discover Relationships Between Malicious Network Entities",
    meta: "ACM CCS Poster - 2019",
    year: 2019,
    citations: 10,
    summary:
      "Applies NLP techniques to security reports to uncover relationships between malicious entities and support faster analyst triage.",
    highlights: ["NLP for security", "Entity linking", "Threat report mining"],
    href: "https://dl.acm.org/doi/10.1145/3319535.3363219",
    weight: 12,
  },
  {
    title: "Net2Vec: Deep Learning for the Network",
    meta: "CoRR / arXiv - 2017",
    year: 2017,
    citations: 27,
    summary:
      "Frames network analytics as an end-to-end deep-learning problem, connecting packet streams, representation learning, and task-specific outputs.",
    highlights: ["Deep learning", "Network analytics", "End-to-end pipelines"],
    href: "https://arxiv.org/abs/1705.08341",
    weight: 18,
  },
  {
    title: "The Cookie Recipe: Untangling the Use of Cookies in the Wild",
    meta: "TMA - 2017",
    year: 2017,
    citations: 35,
    summary:
      "Analyzes large-scale cookie deployment and usage patterns to separate legitimate web functionality from aggressive tracking behavior.",
    highlights: ["Web tracking", "Cookie measurement", "Privacy engineering"],
    href: "https://ieeexplore.ieee.org/document/8002896",
    weight: 20,
  },
  {
    title: "User Profiling in the Time of HTTPS",
    meta: "IMC - 2016",
    year: 2016,
    citations: 50,
    summary:
      "Demonstrates that encrypted web traffic still leaks enough behavioral structure for profiling unless stronger privacy protections are applied.",
    highlights: ["HTTPS traffic", "Privacy leakage", "Internet measurement"],
    href: "https://dl.acm.org/doi/10.1145/2987443.2987459",
    weight: 23,
  },
  {
    title: "Understanding the Detection of View Fraud in Video Content Portals",
    meta: "WWW - 2016",
    year: 2016,
    citations: 75,
    summary:
      "Reverse-engineers how major video platforms detect fraudulent views and shows where fraud controls succeed or fail.",
    highlights: ["Fraud detection", "Online video ecosystems", "Measurement study"],
    href: "https://dl.acm.org/doi/10.1145/2872427.2882980",
    weight: 28,
  },
  {
    title: "The Value of Online Users: Empirical Evaluation of the Price of Personalized Ads",
    meta: "ARES - 2016",
    year: 2016,
    citations: 10,
    summary:
      "Measures how much value targeted advertising extracts from user data and quantifies the market spread behind personalized ads.",
    highlights: ["Ad economics", "Data valuation", "Privacy markets"],
    href: "https://ieeexplore.ieee.org/document/7784911",
    weight: 11,
  },
  {
    title: "Your Data in the Eyes of the Beholders",
    meta: "ARES - 2016",
    year: 2016,
    citations: 5,
    summary:
      "Designs a unified valuation portal that estimates the market value of personal information across data categories and stakeholders.",
    highlights: ["Personal data valuation", "Privacy UX", "Market transparency"],
    href: "https://ieeexplore.ieee.org/document/7784912",
    weight: 8,
  },
  {
    title: "Assessing the Evolution of Google+ in Its First Two Years",
    meta: "IEEE/ACM Transactions on Networking - 2016",
    year: 2016,
    citations: 8,
    summary:
      "Extends the first-year Google+ measurement study into a longitudinal analysis of adoption, engagement, and structural change.",
    highlights: ["Longitudinal measurement", "Social platforms", "Network evolution"],
    href: "https://ieeexplore.ieee.org/document/7124054",
    weight: 11,
  },
  {
    title: "Quantifying the Economic and Cultural Biases of Social Media Through Trending Topics",
    meta: "PLOS ONE - 2015",
    year: 2015,
    citations: 28,
    summary:
      "Studies how trending-topic mechanisms reflect economic and cultural asymmetries across regions, audiences, and languages.",
    highlights: ["Trending topics", "Bias measurement", "Social media analytics"],
    href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0134407",
    weight: 18,
  },
  {
    title: "Google+ or Google-? Dissecting the Evolution of the New OSN in Its First Year",
    meta: "WWW - 2013",
    year: 2013,
    citations: 80,
    summary:
      "Measures the early growth, engagement, and structural dynamics of Google+ to understand how a new social network evolves at scale.",
    highlights: ["Social network analysis", "Large-scale measurement", "User behavior"],
    href: "https://dl.acm.org/doi/10.1145/2488388.2488448",
    weight: 30,
  },
  {
    title: "Analysis of the Evolution of Social Ecosystems Using Twitter and Google+",
    meta: "IEEE Network - 2013",
    year: 2013,
    citations: 17,
    summary:
      "Compares the evolution of major social ecosystems and shows how platform structure shapes community formation and information flow.",
    highlights: ["Online social networks", "Comparative analysis", "Ecosystem evolution"],
    href: "https://ieeexplore.ieee.org/document/6631472",
    weight: 14,
  },
  {
    title: "Are Trending Topics Useful for Marketing? Visibility of Trending Topics vs Traditional Advertisement",
    meta: "COSN - 2013",
    year: 2013,
    citations: 32,
    summary:
      "Evaluates whether promoted and organic trending topics provide real visibility advantages over conventional advertising channels.",
    highlights: ["Online marketing", "Social media visibility", "Empirical measurement"],
    href: "https://dl.acm.org/doi/10.1145/2512938.2512958",
    weight: 19,
  },
  {
    title: "Energy Efficient Content Distribution in an ISP Network",
    meta: "GLOBECOM - 2013",
    year: 2013,
    citations: 25,
    summary:
      "Optimizes content placement and distribution in ISP infrastructure to reduce energy consumption without sacrificing delivery performance.",
    highlights: ["Green networking", "Content distribution", "ISP optimization"],
    href: "https://ieeexplore.ieee.org/document/6831555",
    weight: 15,
  },
  {
    title: "Investigating the Reaction of BitTorrent Content Publishers to Antipiracy Actions",
    meta: "IEEE P2P - 2013",
    year: 2013,
    citations: 17,
    summary:
      "Tracks how BitTorrent publishers adapt their behavior in response to takedowns and antipiracy interventions.",
    highlights: ["BitTorrent ecosystems", "Adversarial adaptation", "Content publishing"],
    href: "https://ieeexplore.ieee.org/document/6688715",
    weight: 12,
  },
  {
    title: "Where Are My Followers? Understanding the Locality Effect in Twitter",
    meta: "arXiv preprint - 2011",
    year: 2011,
    citations: 59,
    summary:
      "Examines geographic locality in follower graphs and shows how platform-scale connections remain shaped by regional clustering.",
    highlights: ["Twitter analysis", "Geographic locality", "OSN structure"],
    href: "https://arxiv.org/abs/1105.3682",
    weight: 25,
  },
  {
    title: "SCIPER: Secure Collaborative Inference via Privacy-Enhancing Regularization",
    meta: "IEEE Transactions on Privacy - 2024",
    year: 2024,
    citations: 4,
    summary:
      "Introduces a privacy-enhancing regularization approach for collaborative inference so multiple parties can share utility while reducing sensitive leakage.",
    highlights: ["Privacy-enhancing technologies", "Collaborative inference", "Trustworthy AI"],
    href: "https://www.licorice-horizon.eu/technical-publications/",
    weight: 9,
  },
  {
    title: "Web of Shadows: Investigating Malware Abuse of Internet Services",
    meta: "Computers & Security - 2025",
    year: 2025,
    citations: 6,
    summary:
      "Studies how attackers abuse legitimate internet services to host, redirect, and operationalize malware infrastructure.",
    highlights: ["Malware operations", "Internet abuse", "Threat infrastructure"],
    href: "https://www.sciencedirect.com/journal/computers-and-security",
    weight: 12,
  },
];

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function pickWeightedSample(list, count) {
  const pool = list.map((item) => ({ ...item }));
  const picked = [];
  while (pool.length && picked.length < count) {
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
    let threshold = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let i = 0; i < pool.length; i += 1) {
      threshold -= pool[i].weight || 1;
      if (threshold <= 0) {
        chosenIndex = i;
        break;
      }
    }
    picked.push(pool.splice(chosenIndex, 1)[0]);
  }
  return picked;
}

function renderRandomPublications() {
  const mount = document.getElementById("publications-list");
  if (!mount) return;

  const sample = shuffle(pickWeightedSample(publications, 6)).slice(0, 6);
  mount.innerHTML = "";

  sample.forEach((publication) => {
    const item = document.createElement("article");
    item.className = "pub";
    item.tabIndex = 0;

    const highlightItems = publication.highlights
      .map((highlight) => `<li>${highlight}</li>`)
      .join("");

    item.innerHTML = `
      <div class="pub-shell">
        <div class="pub-front">
          <p class="pub-kicker">Selected from the broader publication record</p>
          <p class="pub-title">${publication.title}</p>
          <p class="pub-meta">${publication.meta}</p>
          <div class="pub-stats">
            <span class="pub-stat">${publication.citations}+ citations</span>
            <span class="pub-stat">${publication.year}</span>
          </div>
        </div>
        <div class="pub-hover">
          <div class="pub-hover-body">
            <p class="pub-summary">${publication.summary}</p>
            <ul class="pub-highlights">${highlightItems}</ul>
          </div>
          <div class="pub-hover-actions">
            <a class="pub-link" href="${publication.href}" target="_blank" rel="noreferrer">Open publication</a>
          </div>
        </div>
      </div>
    `;

    mount.appendChild(item);
    registerReveal(item);
  });
}

renderRandomPublications();
