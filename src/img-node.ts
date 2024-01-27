import { DownloadState } from "./img-fetcher";

const DEFAULT_THUMBNAIL = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

const DEFAULT_NODE_TEMPLATE = document.createElement("div");
DEFAULT_NODE_TEMPLATE.classList.add("img-node");
DEFAULT_NODE_TEMPLATE.innerHTML = `<div style="position: relative;"><img decoding="sync" loading="lazy" title="untitle.jpg" src="${DEFAULT_THUMBNAIL}" /></div>`;

const OVERLAY_TIP = document.createElement("div");
OVERLAY_TIP.classList.add("overlay-tip");
OVERLAY_TIP.innerHTML = `<span>GIF</span>`;

export default class ImageNode {
  root?: HTMLElement;
  src: string;
  href: string;
  title: string;
  onclick?: (event: MouseEvent) => void;
  imgElement?: HTMLImageElement;
  private blobUrl?: string;
  private mimeType?: string;
  private size?: number;
  private downloadBar?: HTMLElement;
  private rendered: boolean = false;
  constructor(src: string, href: string, title: string) {
    this.src = src;
    this.href = href;
    this.title = title;
  }

  create(): HTMLElement {
    this.root = DEFAULT_NODE_TEMPLATE.cloneNode(true) as HTMLElement;
    this.imgElement = this.root.firstElementChild!.firstElementChild! as HTMLImageElement;
    this.imgElement.setAttribute("title", this.title);
    if (this.onclick) {
      this.imgElement!.addEventListener("click", this.onclick);
    }
    return this.root;
  }

  render() {
    if (this.imgElement) {
      this.rendered = true;
      if (this.mimeType === "image/gif") {
        const tip = OVERLAY_TIP.cloneNode(true);
        tip.firstChild!.textContent = "GIF";
        this.root?.appendChild(tip);
        // if gif size over 20MB, then don't render it
        if (this.size && this.size > 20 * 1024 * 1024) {
          return;
        }
      }
      if (this.mimeType === "video/mp4") {
        const tip = OVERLAY_TIP.cloneNode(true);
        tip.firstChild!.textContent = "MP4";
        this.root?.appendChild(tip);
        return;
      }
      if (this.blobUrl) {
        this.imgElement.src = this.blobUrl;
      } else {
        this.imgElement.src = this.src;
      }
    }
  }

  unrender() {
    if (!this.rendered) return;
    if (this.imgElement) {
      this.imgElement.src = this.src;
    }
  }

  onloaded(blobUrl: string, mimeType: string, size: number) {
    this.blobUrl = blobUrl;
    this.mimeType = mimeType;
    this.size = size;
  }

  progress(state: DownloadState) {
    if (state.readyState === 4) {
      if (this.downloadBar && this.downloadBar.parentNode) {
        // this.downloadBar.remove(); // in steam, it randomly throw parentNode is null
        this.downloadBar.parentNode.removeChild(this.downloadBar);
      }
      return;
    }
    if (!this.downloadBar) {
      const downloadBar = document.createElement("div");
      downloadBar.classList.add("downloadBar");
      downloadBar.innerHTML = `
      <progress style="position: absolute; width: 100%; height: 7px; left: 0; bottom: 0; border: none;" value="0" max="100" />
      `;
      this.downloadBar = downloadBar;
      this.root!.firstElementChild!.appendChild(this.downloadBar);
    }
    if (this.downloadBar) {
      this.downloadBar.querySelector("progress")!.setAttribute("value", (state.loaded / state.total) * 100 + "");
    }
  }

  changeStyle(fetchStatus?: "fetching" | "fetched" | "failed") {
    if (!this.root) return;
    switch (fetchStatus) {
      case "fetching":
        this.root.classList.add("img-fetching");
        break
      case "fetched":
        this.root.classList.add("img-fetched");
        this.root.classList.remove("img-fetching");
        break;
      case "failed":
        this.root.classList.add("img-fetch-failed");
        this.root.classList.remove("img-fetching");
        break;
      default:
        this.root.classList.remove("img-fetched");
        this.root.classList.remove("img-fetch-failed");
        this.root.classList.remove("img-fetching");
    }
  }

  equal(ele: HTMLElement) {
    if (ele === this.root) {
      return true;
    }
    if (ele === this.root?.firstElementChild) {
      return true;
    }
    if (ele === this.imgElement) {
      return true;
    }
    return false;
  }

}