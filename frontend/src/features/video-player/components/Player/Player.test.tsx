import { fireEvent, render, screen } from '@testing-library/react';
import { videoDetail } from '../../../../test/fixtures';
import { Player } from './Player';

const [tr, en] = videoDetail.tracks;

describe('Player', () => {
  it('plays the chosen audio stream with the chosen subtitles', () => {
    const { container } = render(<Player title="Video" audio={en!} subtitle={tr!} seek={{ sec: 0, nonce: 0 }} onTime={() => {}} />);
    expect(screen.getByLabelText('Video')).toHaveAttribute('src', '/uploads/videos/1/en.mp4');
    expect(container.querySelector('track')).toHaveAttribute('src', '/uploads/videos/1/tr.vtt');
  });

  it('starts at the requested second and reports time', () => {
    const onTime = vi.fn();
    render(<Player title="Video" audio={tr!} subtitle={null} seek={{ sec: 108, nonce: 1 }} onTime={onTime} />);
    const video = screen.getByLabelText<HTMLVideoElement>('Video');
    expect(video.currentTime).toBe(108);
    fireEvent.timeUpdate(video);
    expect(onTime).toHaveBeenCalledWith(108);
  });
});
