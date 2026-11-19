import React from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { ParticipantTile } from './ParticipantTile';

export const VideoGrid: React.FC = () => {
  const {
    participants,
    viewMode,
    activeSpeakerId,
    pinnedParticipantId,
    setPinnedParticipant,
  } = useMeetingStore();

  const total = participants.length;

  // Determine active speaker or pinned participant
  const dominantId = pinnedParticipantId || activeSpeakerId || (participants[1] ? participants[1].id : participants[0]?.id);
  const dominantParticipant = participants.find((p) => p.id === dominantId) || participants[0];
  const screenSharer = participants.find((p) => p.isScreenSharing);

  // If someone is sharing screen or in Speaker view, prioritize the dominant view
  const isSpecialView = viewMode === 'speaker' || !!screenSharer;

  if (isSpecialView && dominantParticipant) {
    const thumbnails = participants.filter((p) => p.id !== (screenSharer ? screenSharer.id : dominantParticipant.id));
    const mainViewParticipant = screenSharer || dominantParticipant;

    return (
      <div className="w-full h-full flex flex-col gap-3 p-4">
        {/* Top Filmstrip Thumbnails */}
        {thumbnails.length > 0 && (
          <div className="h-36 flex items-center gap-3 overflow-x-auto pb-2 shrink-0 scrollbar-none">
            {thumbnails.map((p) => (
              <div key={p.id} className="w-52 h-full shrink-0">
                <ParticipantTile
                  participant={p}
                  isPinned={pinnedParticipantId === p.id}
                  onPin={() =>
                    setPinnedParticipant(pinnedParticipantId === p.id ? null : p.id)
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Dominant Active Speaker / Screen Share Stage */}
        <div className="flex-1 min-h-0">
          <ParticipantTile
            participant={mainViewParticipant}
            isSpeakerView={true}
            isPinned={pinnedParticipantId === mainViewParticipant.id}
            onPin={() =>
              setPinnedParticipant(
                pinnedParticipantId === mainViewParticipant.id ? null : mainViewParticipant.id
              )
            }
          />
        </div>
      </div>
    );
  }

  // Gallery View: Responsive CSS Grid
  let gridCols = 'grid-cols-1';
  if (total === 2) gridCols = 'grid-cols-1 md:grid-cols-2';
  else if (total >= 3 && total <= 4) gridCols = 'grid-cols-1 sm:grid-cols-2';
  else if (total >= 5 && total <= 6) gridCols = 'grid-cols-2 lg:grid-cols-3';
  else if (total > 6) gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`w-full h-full p-4 grid ${gridCols} gap-3 md:gap-4 items-center justify-center overflow-y-auto`}>
      {participants.map((participant) => (
        <div key={participant.id} className="w-full h-full min-h-[220px] max-h-[460px]">
          <ParticipantTile
            participant={participant}
            isPinned={pinnedParticipantId === participant.id}
            onPin={() =>
              setPinnedParticipant(pinnedParticipantId === participant.id ? null : participant.id)
            }
          />
        </div>
      ))}
    </div>
  );
};

