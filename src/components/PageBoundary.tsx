import { Component, type ReactNode } from 'react';
import { Button } from './ui';

/** Keeps one broken page from blanking the whole workspace; navigation stays usable. */
export class PageBoundary extends Component<{ resetKey: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous: { resetKey: string }) {
    // Navigating elsewhere retries; a working page is never remounted.
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto flex max-w-[480px] flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="font-display text-[17px] font-semibold">Halaman ini gagal dimuat</div>
        <p className="text-[13px] text-muted">Ada data yang belum bisa ditampilkan. Halaman lain tetap bisa dibuka.</p>
        <Button onClick={() => this.setState({ failed: false })}>Coba lagi</Button>
      </div>
    );
  }
}
