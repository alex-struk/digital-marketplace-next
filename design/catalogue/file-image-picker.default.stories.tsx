import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text } from "@bcgov/design-system-react-components";

// file-image-picker · default — a vendor editing their own profile, with a profile picture already stored. The picture
// is shown from the address it is stored at, as it was stored: an upload 2000 by 300 pixels is held at 500 by 75
// (R-8.13), and it is readable by anyone, signed in or not (R-8.28). The chooser offers only JPEG and PNG files, and the
// rule and the size limit are stated before a file is chosen (R-8.17, R-8.21, R-8.30). The rest of the profile form is
// the users domain's (user-profile-self · editing) and is trimmed here. The same picker is the organization logo's.
const meta: Meta = { title: "files/file-image-picker/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const picture = { display: "grid", gap: "var(--layout-margin-small)", justifyItems: "start" } as const;
const image = { maxWidth: "100%", height: "auto" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <Form validationBehavior="aria" style={stack}>
        <div role="group" aria-labelledby="picture-label" style={picture}>
          <Text elementType="p" id="picture-label">Profile picture (optional)</Text>
          <img
            src="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000805?type=blob"
            alt="Your current profile picture"
            style={image}
            data-testid="profile-image"
          />
          <div id="image-file-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              A JPEG or PNG image, up to 10 MB. A picture wider or taller than 500 pixels is made smaller to fit, keeping its
              proportions. Anyone can see your profile picture, including people who are not signed in.
            </Text>
          </div>
          <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
            <Button variant="secondary" aria-describedby="image-file-rule" data-testid="change-avatar">
              Choose a different profile picture
            </Button>
          </FileTrigger>
        </div>
        <Text elementType="p" size="small" color="secondary">
          Sign-in username, name and email address follow. They are the users domain's design and are not shown here.
        </Text>
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary">Save changes</Button>
          <Button variant="secondary">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
