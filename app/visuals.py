import numpy as np
import plotly.graph_objects as go


def create_bloch_figure(bloch_vector: np.ndarray, title: str = "") -> go.Figure:
    r = np.asarray(bloch_vector, dtype=float)
    x, y, z = r.tolist()

    # Sphere mesh
    phi = np.linspace(0, np.pi, 40)
    theta = np.linspace(0, 2 * np.pi, 80)
    phi, theta = np.meshgrid(phi, theta)
    xs = np.sin(phi) * np.cos(theta)
    ys = np.sin(phi) * np.sin(theta)
    zs = np.cos(phi)

    sphere = go.Surface(
        x=xs,
        y=ys,
        z=zs,
        showscale=False,
        opacity=0.15,
        colorscale=[[0, "#1f77b4"], [1, "#1f77b4"]],
    )

    # Axes
    axis_len = 1.2
    axes = []
    axes.append(go.Scatter3d(x=[0, axis_len], y=[0, 0], z=[0, 0], mode="lines", line=dict(color="red", width=4), name="X"))
    axes.append(go.Scatter3d(x=[0, 0], y=[0, axis_len], z=[0, 0], mode="lines", line=dict(color="green", width=4), name="Y"))
    axes.append(go.Scatter3d(x=[0, 0], y=[0, 0], z=[0, axis_len], mode="lines", line=dict(color="blue", width=4), name="Z"))

    # Vector r
    vector = go.Scatter3d(
        x=[0, x], y=[0, y], z=[0, z],
        mode="lines+markers",
        line=dict(color="#FF8C00", width=8),
        marker=dict(size=3, color="#FF8C00"),
        name="Bloch vector",
    )

    fig = go.Figure(data=[sphere, *axes, vector])
    fig.update_layout(
        title=title,
        scene=dict(
            xaxis=dict(range=[-1.3, 1.3], zeroline=False, showspikes=False),
            yaxis=dict(range=[-1.3, 1.3], zeroline=False, showspikes=False),
            zaxis=dict(range=[-1.3, 1.3], zeroline=False, showspikes=False),
            aspectmode="cube",
        ),
        margin=dict(l=10, r=10, t=40, b=10),
        showlegend=False,
    )
    return fig


