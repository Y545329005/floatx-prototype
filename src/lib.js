import {
  MonitorPlay,
  MapPin,
  FileText,
  Newspaper,
} from "lucide-react";

export const BRAND = "财富";

export const eventModeMeta = {
  online: { label: "线上活动", icon: MonitorPlay },
  offline: { label: "线下活动", icon: MapPin },
};

export const eventTopicOptions = ["项目路演", "基金介绍", "投资教育", "市场观点", "投资者交流"];
export const eventTimezoneOptions = ["Asia/Shanghai", "Asia/Hong_Kong", "Europe/London", "America/New_York"];

export const contentBlockTypeMeta = {
  content: { label: "内容", description: "图文、链接与 PDF 附件", icon: FileText },
  news: { label: "新闻", description: "日期、标题与外部链接", icon: Newspaper },
};

export const emptyProjectForm = {
  projectName: "",
  assetClass: "",
  offeringStatus: "",
  tagsText: "",
  introMediaUrl: "",
  projectTagline: "",
  marketDescription: "",
  heroFacts: [],
  contentBlocks: [],
};

export const emptyEventForm = {
  title: "",
  summary: "",
  descriptionHtml: "",
  coverUrl: "",
  mode: "",
  topic: "",
  startAt: "",
  endAt: "",
  timezone: "Asia/Shanghai",
  platform: "",
  city: "",
  venue: "",
  registrationUrl: "",
  joinUrl: "",
  replayAvailable: false,
  replayUrl: "",
  projectIds: [],
  agenda: [],
  capacity: "",
  cancelReason: "",
};

export const emptyNewsForm = {
  title: "",
  date: "",
  url: "",
  projectId: "",
};

export function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { route: "market", id: "" };
  const [route = "market", id = ""] = hash.split("/");
  return { route, id };
}

export function roleForRoute(route) {
  return String(route || "").startsWith("admin") ? "admin" : "investor";
}

export function searchDomainForRoute(route) {
  if (["events", "event", "adminEvents"].includes(route)) return "events";
  if (["news", "adminNews"].includes(route)) return "news";
  return "projects";
}

export function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatTimestamp(value) {
  if (!value) return "—";
  return value.slice(0, 16);
}

export function matchesSearch(query, ...values) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  return values
    .flat()
    .filter((value) => value !== null && value !== undefined)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function filterProjectsBySearch(projects, query) {
  return projects.filter((project) => matchesSearch(
    query,
    project.projectName,
    project.projectTagline,
    project.marketDescription,
    project.assetClass,
    project.offeringStatus,
    project.tags,
    project.heroFacts?.flatMap((fact) => [fact.label, fact.value]),
    project.contentBlocks?.flatMap((block) => [
      block.title,
      block.type === "content" ? stripRichText(getBlockContentHtml(block)) : "",
      block.attachments?.flatMap((attachment) => [attachment.fileName, attachment.url]),
    ]),
  ));
}

let contentBlockSequence = Date.now();
let factSequence = Date.now();
let attachmentSequence = Date.now();
let eventAgendaSequence = Date.now();

export function createContentBlockId() {
  contentBlockSequence += 1;
  return `block-${contentBlockSequence}`;
}

export function createFactId(prefix = "fact") {
  factSequence += 1;
  return `${prefix}-${factSequence}`;
}

export function createFactItem(prefix = "fact") {
  return { id: createFactId(prefix), label: "", value: "" };
}

export function createAttachmentId() {
  attachmentSequence += 1;
  return `attachment-${attachmentSequence}`;
}

export function createEventAgendaItem() {
  eventAgendaSequence += 1;
  return { id: `event-agenda-${eventAgendaSequence}`, time: "", title: "" };
}

export function sortNewsItems(items = []) {
  return items
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((left, right) => (
      String(right.date || "").localeCompare(String(left.date || ""))
      || left.originalIndex - right.originalIndex
    ))
    .map(({ originalIndex, ...item }) => item);
}

export function filterNewsBySearch(newsItems, query, projects = []) {
  const projectNames = new Map(projects.map((project) => [project.id, project.projectName]));
  return newsItems.filter((item) => matchesSearch(
    query,
    item.date,
    item.title,
    item.url,
    item.projectId ? projectNames.get(item.projectId) || "" : "平台新闻",
  ));
}

export function createEmptyNewsForm() {
  return { ...emptyNewsForm };
}

export function newsToForm(item) {
  return {
    title: item.title || "",
    date: item.date || "",
    url: item.url || "",
    projectId: item.projectId || "",
  };
}

export function buildNewsFromForm(form, existingItem) {
  const timestamp = nowStamp();
  return {
    id: existingItem?.id || `news-${Date.now()}`,
    title: String(form.title || "").trim(),
    date: String(form.date || "").trim(),
    url: String(form.url || "").trim(),
    projectId: String(form.projectId || "").trim(),
    publicationStatus: existingItem?.publicationStatus || "draft",
    createdAt: existingItem?.createdAt || timestamp,
    updatedAt: timestamp,
    publishedAt: existingItem?.publishedAt || "",
  };
}

export function validateNewsForm(form, { forPublication = false } = {}) {
  if (!String(form.title || "").trim()) return "请先填写新闻标题或描述。";
  if (String(form.url || "").trim() && !getSafeExternalUrl(form.url)) {
    return "新闻网址无效，请填写完整的 http 或 https 地址。";
  }
  if (!forPublication) return "";
  if (!String(form.date || "").trim()) return "发布前请填写新闻日期。";
  if (!getSafeExternalUrl(form.url)) return "发布前请填写有效的新闻网址。";
  return "";
}

export function getEventDate(value, timeZone = "Asia/Shanghai") {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const [, year, month, day, hour, minute, second = "00"] = match;
  const targetTimestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    let candidate = new Date(targetTimestamp);
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const parts = Object.fromEntries(
        formatter.formatToParts(candidate)
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value]),
      );
      const renderedTimestamp = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
      );
      const adjustment = targetTimestamp - renderedTimestamp;
      if (!adjustment) break;
      candidate = new Date(candidate.getTime() + adjustment);
    }
    return candidate;
  } catch {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

export function sortEventsForTab(events = [], tab = "upcoming") {
  return [...events].sort((left, right) => {
    const leftValue = getEventDate(tab === "replay" ? left.endAt : left.startAt, left.timezone)?.getTime() || 0;
    const rightValue = getEventDate(tab === "replay" ? right.endAt : right.startAt, right.timezone)?.getTime() || 0;
    return tab === "replay" ? rightValue - leftValue : leftValue - rightValue;
  });
}

export function filterEventsBySearch(events, query, projects = []) {
  const projectNames = new Map(projects.map((project) => [project.id, project.projectName]));
  return events.filter((event) => matchesSearch(
    query,
    event.title,
    event.summary,
    event.topic,
    event.mode === "online" ? "线上活动" : event.mode === "offline" ? "线下活动" : "",
    event.city,
    event.venue,
    event.platform,
    stripRichText(event.descriptionHtml || ""),
    event.projectIds?.map((projectId) => projectNames.get(projectId) || ""),
  ));
}

export function formatEventDate(event) {
  const date = getEventDate(event?.startAt, event?.timezone);
  if (!date) return "时间待定";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: event.timezone || "Asia/Shanghai",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
  }
}

export function formatEventTimeRange(event) {
  const start = getEventDate(event?.startAt, event?.timezone);
  const end = getEventDate(event?.endAt, event?.timezone);
  if (!start || !end) return "时间待定";
  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  try {
    const formatter = new Intl.DateTimeFormat("zh-CN", { ...options, timeZone: event.timezone || "Asia/Shanghai" });
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  } catch {
    const formatter = new Intl.DateTimeFormat("zh-CN", options);
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }
}

export function formatEventAdminDate(event) {
  const date = getEventDate(event?.startAt, event?.timezone);
  if (!date) return "—";
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: event.timezone || "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(date)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  } catch {
    return String(event.startAt || "").replace("T", " ");
  }
}

export function getEventTimezoneLabel(value) {
  return {
    "Asia/Shanghai": "上海时间",
    "Asia/Hong_Kong": "香港时间",
    "Europe/London": "伦敦时间",
    "America/New_York": "纽约时间",
  }[value] || value || "时区待定";
}

export function createEmptyEventForm() {
  return {
    ...emptyEventForm,
    projectIds: [],
    agenda: [createEventAgendaItem()],
  };
}

export function eventToForm(event) {
  return {
    title: event.title || "",
    summary: event.summary || "",
    descriptionHtml: event.descriptionHtml || "",
    coverUrl: event.coverUrl || "",
    mode: event.mode || "",
    topic: event.topic || "",
    startAt: event.startAt || "",
    endAt: event.endAt || "",
    timezone: event.timezone || "Asia/Shanghai",
    platform: event.platform || "",
    city: event.city || "",
    venue: event.venue || "",
    registrationUrl: event.registrationUrl || "",
    joinUrl: event.joinUrl || "",
    replayAvailable: Boolean(event.replayAvailable),
    replayUrl: event.replayUrl || "",
    projectIds: [...(event.projectIds || [])],
    agenda: (event.agenda || []).map((item) => ({ ...item })),
    capacity: event.capacity || "",
    cancelReason: event.cancelReason || "",
  };
}

export function buildEventFromForm(form, existingEvent) {
  const timestamp = nowStamp();
  return {
    id: existingEvent?.id || `event-${Date.now()}`,
    title: String(form.title || "").trim(),
    summary: String(form.summary || "").trim(),
    descriptionHtml: sanitizeRichHtml(form.descriptionHtml || ""),
    coverUrl: String(form.coverUrl || "").trim(),
    mode: eventModeMeta[form.mode] ? form.mode : "",
    topic: String(form.topic || "").trim(),
    startAt: String(form.startAt || "").trim(),
    endAt: String(form.endAt || "").trim(),
    timezone: String(form.timezone || "Asia/Shanghai").trim(),
    platform: form.mode === "online" ? String(form.platform || "").trim() : "",
    city: form.mode === "offline" ? String(form.city || "").trim() : "",
    venue: form.mode === "offline" ? String(form.venue || "").trim() : "",
    registrationUrl: String(form.registrationUrl || "").trim(),
    joinUrl: form.mode === "online" ? String(form.joinUrl || "").trim() : "",
    replayAvailable: Boolean(form.replayAvailable),
    replayUrl: form.replayAvailable ? String(form.replayUrl || "").trim() : "",
    projectIds: [...new Set(form.projectIds || [])],
    agenda: (form.agenda || [])
      .map((item) => ({ ...item, time: String(item.time || "").trim(), title: String(item.title || "").trim() }))
      .filter((item) => item.time || item.title),
    capacity: String(form.capacity || "").trim(),
    publicationStatus: existingEvent?.publicationStatus || "draft",
    cancelled: Boolean(existingEvent?.cancelled),
    cancelReason: String(form.cancelReason || existingEvent?.cancelReason || "").trim(),
    createdAt: existingEvent?.createdAt || timestamp,
    updatedAt: timestamp,
    publishedAt: existingEvent?.publishedAt || "",
  };
}

export function validateEventForm(form, { forPublication = false } = {}) {
  if (!String(form.title || "").trim()) return "请先填写活动标题。";
  const urlFields = [
    form.registrationUrl,
    form.mode === "online" ? form.joinUrl : "",
    form.replayAvailable ? form.replayUrl : "",
  ].filter((value) => String(value || "").trim());
  if (urlFields.some((value) => !getSafeExternalUrl(value))) return "活动链接无效，请使用 http 或 https 地址。";
  if (!forPublication) return "";
  if (!String(form.summary || "").trim()) return "发布前请填写活动简介。";
  if (!String(form.descriptionHtml || "").trim() || !stripRichText(form.descriptionHtml || "")) return "发布前请填写活动详情。";
  if (!getSafeRichImageUrl(form.coverUrl)) return "发布前请上传活动封面。";
  if (!eventModeMeta[form.mode]) return "发布前请选择活动形式。";
  if (!String(form.topic || "").trim()) return "发布前请选择活动主题。";
  const start = getEventDate(form.startAt, form.timezone);
  const end = getEventDate(form.endAt, form.timezone);
  if (!start || !end) return "发布前请填写完整的开始和结束时间。";
  if (end <= start) return "活动结束时间必须晚于开始时间。";
  if (form.mode === "online" && !String(form.platform || "").trim()) return "线上活动请填写会议平台。";
  if (form.mode === "online" && !getSafeExternalUrl(form.joinUrl)) return "线上活动发布前请填写有效的会议链接。";
  if (form.mode === "offline" && (!String(form.city || "").trim() || !String(form.venue || "").trim())) {
    return "线下活动请填写城市和活动地点。";
  }
  return "";
}

export function downloadEventCalendar(event) {
  const start = getEventDate(event?.startAt, event?.timezone);
  const end = getEventDate(event?.endAt, event?.timezone);
  if (!start || !end) return false;
  const formatCalendarDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escapeCalendarText = (value) => String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
  const location = event.mode === "offline"
    ? [event.city, event.venue].filter(Boolean).join(" · ")
    : event.platform;
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wealth Platform//Events//CN",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(event.id)}@wealth-platform.demo`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${escapeCalendarText(event.title)}`,
    `DESCRIPTION:${escapeCalendarText(event.summary)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${String(event.title || "活动").replace(/[\\/:*?\"<>|]/g, "-")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

export function getDisplayNewsItems(newsItems = []) {
  return sortNewsItems(newsItems)
    .filter((item) => item.publicationStatus === "published")
    .filter((item) => item.date && item.title && getSafeExternalUrl(item.url));
}

export function formatNewsDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || "日期待定");
  return `${match[1]} 年 ${Number(match[2])} 月 ${Number(match[3])} 日`;
}

export function createContentBlock(type) {
  const baseBlock = {
    id: createContentBlockId(),
    type,
    title: contentBlockTypeMeta[type]?.label || "新内容块",
  };
  if (type === "news") return baseBlock;
  return {
    ...baseBlock,
    type: "content",
    contentHtml: "",
    attachments: [],
  };
}

export function cloneContentBlocks(blocks = []) {
  return blocks.map((block) => ({
    ...block,
    attachments: (block.attachments || []).map((attachment) => ({ ...attachment })),
  }));
}

export function createEmptyProjectForm() {
  return {
    ...emptyProjectForm,
    heroFacts: [createFactItem("hero"), createFactItem("hero")],
    contentBlocks: [],
  };
}

export function getSafeHttpUrl(value) {
  const source = String(value || "").trim();
  if (source.startsWith("/") && !source.startsWith("//") && !source.includes("\\")) return source;
  if (!/^https?:\/\//i.test(source)) return "";
  try {
    const parsed = new URL(source);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

export function getSafeExternalUrl(value) {
  const source = String(value || "").trim();
  const normalized = /^www\./i.test(source) ? `https://${source}` : source;
  if (!/^https?:\/\//i.test(normalized)) return "";
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

export function getExternalUrlHost(value) {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return "";
  try {
    return new URL(safeUrl).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function getSafeRichImageUrl(value) {
  const source = String(value || "").trim();
  if (source.startsWith("blob:")) return source;
  return getSafeHttpUrl(source);
}

export function getSafeAttachmentUrl(value) {
  const source = String(value || "").trim();
  if (source.startsWith("blob:")) return source;
  return getSafeHttpUrl(source);
}

export function getSafeNewsUrl(value) {
  return getSafeExternalUrl(value);
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function plainTextToRichHtml(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

export function getBlockContentHtml(block) {
  if (String(block?.contentHtml || "").trim()) return String(block.contentHtml);
  let html = plainTextToRichHtml(block?.body);
  const imageUrl = getSafeRichImageUrl(block?.imageUrl);
  if (imageUrl) {
    const caption = String(block?.imageCaption || "").trim();
    html += `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(block?.title || "项目配图")}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
  }
  return html;
}

export function seedRichContent({ body, imageUrl = "", imageCaption = "", sourceUrl = "", sourceLabel = "查看官方资料" }) {
  let html = plainTextToRichHtml(body);
  const safeImageUrl = getSafeRichImageUrl(imageUrl);
  if (safeImageUrl) {
    html += `<figure><img src="${escapeHtml(safeImageUrl)}" alt="${escapeHtml(imageCaption || "项目图片")}">${imageCaption ? `<figcaption>${escapeHtml(imageCaption)}</figcaption>` : ""}</figure>`;
  }
  const safeSourceUrl = getSafeHttpUrl(sourceUrl);
  if (safeSourceUrl) {
    html += `<p><a href="${escapeHtml(safeSourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel)}</a></p>`;
  }
  return html;
}

export const allowedRichTags = new Set([
  "p", "div", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li",
  "blockquote", "a", "figure", "img", "figcaption", "h3", "h4",
]);

export function sanitizeRichHtml(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const template = document.createElement("template");
  template.innerHTML = source;
  const output = document.createElement("div");

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "embed", "svg", "template"].includes(tag)) return null;

    if (!allowedRichTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      [...node.childNodes].forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }

    if (tag === "img") {
      const safeSource = getSafeRichImageUrl(node.getAttribute("src"));
      if (!safeSource) return null;
      const image = document.createElement("img");
      image.setAttribute("src", safeSource);
      image.setAttribute("alt", String(node.getAttribute("alt") || "项目配图"));
      return image;
    }

    const cleanElement = document.createElement(tag === "div" ? "p" : tag);
    if (tag === "a") {
      const safeHref = getSafeHttpUrl(node.getAttribute("href"));
      if (safeHref) {
        cleanElement.setAttribute("href", safeHref);
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
    }
    [...node.childNodes].forEach((child) => {
      const cleanChild = cleanNode(child);
      if (cleanChild) cleanElement.appendChild(cleanChild);
    });
    if (tag === "a" && !cleanElement.hasAttribute("href")) {
      const fragment = document.createDocumentFragment();
      while (cleanElement.firstChild) fragment.appendChild(cleanElement.firstChild);
      return fragment;
    }
    return cleanElement;
  }

  [...template.content.childNodes].forEach((child) => {
    const cleanChild = cleanNode(child);
    if (cleanChild) output.appendChild(cleanChild);
  });
  return output.innerHTML;
}

export function stripRichText(value) {
  const container = document.createElement("div");
  container.innerHTML = sanitizeRichHtml(value);
  container.querySelectorAll("br").forEach((breakNode) => breakNode.replaceWith(" "));
  container.querySelectorAll("p, li, blockquote, figure, figcaption, h3, h4").forEach((blockNode) => {
    blockNode.appendChild(document.createTextNode(" "));
  });
  return String(container.textContent || "").replace(/\s+/g, " ").trim();
}

export function getFirstRichImageUrl(value) {
  const container = document.createElement("div");
  container.innerHTML = sanitizeRichHtml(value);
  return getSafeRichImageUrl(container.querySelector("img")?.getAttribute("src"));
}

export function collectBlobUrls(value) {
  return new Set(String(value || "").match(/blob:[^\s\"'<>]+/g) || []);
}

export function collectProjectBlobUrls(projects) {
  const urls = new Set();
  projects.forEach((project) => {
    collectBlobUrls(project.introMediaUrl).forEach((url) => urls.add(url));
    (project.contentBlocks || []).forEach((block) => {
      collectBlobUrls(getBlockContentHtml(block)).forEach((url) => urls.add(url));
      (block.attachments || []).forEach((attachment) => {
        if (String(attachment.url || "").startsWith("blob:")) urls.add(attachment.url);
      });
    });
  });
  return urls;
}

export function collectEventBlobUrls(events) {
  const urls = new Set();
  events.forEach((event) => {
    collectBlobUrls(event.coverUrl).forEach((url) => urls.add(url));
    collectBlobUrls(event.descriptionHtml).forEach((url) => urls.add(url));
  });
  return urls;
}

export function projectToForm(project) {
  return {
    projectName: project.projectName,
    assetClass: project.assetClass || "",
    offeringStatus: project.offeringStatus || "",
    tagsText: (project.tags || []).join(" / "),
    introMediaUrl: project.introMediaUrl || "",
    projectTagline: project.projectTagline || "",
    marketDescription: project.marketDescription || project.projectTagline || "",
    heroFacts: (project.heroFacts || []).map((fact) => ({ ...fact })),
    contentBlocks: cloneContentBlocks(project.contentBlocks)
      .filter((block) => contentBlockTypeMeta[block.type])
      .map((block) => (
        block.type === "content" ? { ...block, contentHtml: getBlockContentHtml(block) } : block
      )),
  };
}

export function buildProjectFromForm(form, existingProject) {
  const timestamp = nowStamp();
  return {
    id: existingProject?.id || `project-${Date.now()}`,
    projectName: form.projectName.trim(),
    assetClass: form.assetClass.trim(),
    offeringStatus: form.offeringStatus.trim(),
    tags: [...new Set(form.tagsText
      .split(/[\/／、,，\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean))],
    followerCount: Math.max(0, Number(existingProject?.followerCount) || 0),
    introMediaUrl: form.introMediaUrl.trim(),
    projectTagline: form.projectTagline.trim(),
    marketDescription: form.marketDescription.trim(),
    heroFacts: form.heroFacts.map((fact) => ({
      ...fact,
      label: String(fact.label || "").trim(),
      value: String(fact.value || "").trim(),
    })),
    contentBlocks: cloneContentBlocks(form.contentBlocks)
      .filter((block) => contentBlockTypeMeta[block.type])
      .map((block) => {
      const baseBlock = {
        id: block.id,
        type: block.type === "news" ? "news" : "content",
        title: String(block.title || "").trim(),
      };
      if (baseBlock.type === "news") return baseBlock;
      return {
        ...baseBlock,
        contentHtml: sanitizeRichHtml(getBlockContentHtml(block)),
        attachments: (block.attachments || []).map((attachment) => ({
          id: attachment.id,
          fileName: String(attachment.fileName || "").trim(),
          url: String(attachment.url || "").trim(),
          source: attachment.source || "",
          fileKey: attachment.fileKey || "",
        })),
      };
      }),
    projectStatus: existingProject?.projectStatus || "draft",
    createdAt: existingProject?.createdAt || timestamp,
    updatedAt: timestamp,
    publishedAt: existingProject?.publishedAt || "",
  };
}

export function validateProjectForm(form, { forPublication = false } = {}) {
  if (!String(form.projectName || "").trim()) return "请先填写项目名称。";
  if (!forPublication) return "";

  const requiredFields = [
    ["项目类型", form.assetClass],
    ["项目状态", form.offeringStatus],
    ["项目一句宣传语", form.projectTagline],
    ["项目简介", form.marketDescription],
  ];
  const missingFields = requiredFields.filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
  if (missingFields.length) return `发布前请完整填写：${missingFields.join("、")}。`;
  const completeHeroFacts = form.heroFacts.filter((fact) => (
    String(fact.label || "").trim() && String(fact.value || "").trim()
  ));
  if (!completeHeroFacts.length) return "发布前至少配置一项首屏关键信息。";
  if (form.heroFacts.some((fact) => (
    Boolean(String(fact.label || "").trim()) !== Boolean(String(fact.value || "").trim())
  ))) return "首屏关键信息需要同时填写字段名和展示值。";
  if (!form.contentBlocks.length) return "发布前至少添加一个页面内容块。";
  if (form.contentBlocks.some((block) => !String(block.title || "").trim())) {
    return "每个内容块都需要填写标题。";
  }
  if (form.contentBlocks.some((block) => !contentBlockTypeMeta[block.type])) {
    return "页面内容仅支持内容和新闻两种类型。";
  }
  if (form.contentBlocks.filter((block) => block.type === "news").length > 1) {
    return "一个项目只需要一个新闻区块，请移除重复区块。";
  }
  if (form.contentBlocks.some((block) => (
    block.type === "content"
    && (block.attachments || []).some((attachment) => !String(attachment.fileName || "").trim())
  ))) return "PDF 文件信息不完整，请重新上传。";
  if (form.introMediaUrl && !getSafeRichImageUrl(form.introMediaUrl)) {
    return "首屏图片无效，请重新选择图片。";
  }
  const invalidAttachment = form.contentBlocks.some((block) => (
    block.type === "content"
    && (block.attachments || []).some((attachment) => attachment.url && !getSafeAttachmentUrl(attachment.url))
  ));
  if (invalidAttachment) return "PDF 文件无效，请重新选择。";
  return "";
}
