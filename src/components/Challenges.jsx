import PhotoChallengeSpinner from './PhotoChallengeSpinner'

function Challenges({ onTakePhoto }) {
  return (
    <div className="challenges-container">
      <PhotoChallengeSpinner onTakePhoto={onTakePhoto} />
    </div>
  )
}

export default Challenges
