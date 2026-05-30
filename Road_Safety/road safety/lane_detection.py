import cv2
import numpy as np

# Open road video
cap = cv2.VideoCapture("videos/road.mp4")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # Resize for stability
    frame = cv2.resize(frame, (1280, 720))

    # Convert to grayscale
    gray = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2GRAY
    )

    # Blur image
    blur = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )

    # Edge detection
    edges = cv2.Canny(
        blur,
        50,
        150
    )

    # Region of interest
    height = edges.shape[0]

    polygons = np.array([
        [
            (200, height),
            (1100, height),
            (750, 350),
            (550, 350)
        ]
    ])

    mask = np.zeros_like(edges)

    cv2.fillPoly(
        mask,
        polygons,
        255
    )

    cropped_edges = cv2.bitwise_and(
        edges,
        mask
    )

    # Detect lines
    lines = cv2.HoughLinesP(
        cropped_edges,
        2,
        np.pi / 180,
        100,
        np.array([]),
        minLineLength=40,
        maxLineGap=5
    )

    # Draw lane lines
    if lines is not None:

        for line in lines:

            x1, y1, x2, y2 = line[0]

            cv2.line(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                5
            )

    # Title
    cv2.putText(
        frame,
        "LANE DETECTION SYSTEM",
        (20, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 255),
        3
    )

    # Show output
    cv2.imshow(
        "Lane Detection",
        frame
    )

    # ESC to close
    if cv2.waitKey(1) == 27:
        break

cap.release()

cv2.destroyAllWindows()