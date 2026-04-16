import struct, zlib, os

def chunk(name, data):
    c = struct.pack('>I', len(data)) + name + data
    return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)

# 180x180 solid green #86EE86
w, h, r, g, b = 180, 180, 0x86, 0xEE, 0x86
sig  = b'\x89PNG\r\n\x1a\n'
ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
raw  = b''.join(b'\x00' + bytes([r, g, b] * w) for _ in range(h))
idat = chunk(b'IDAT', zlib.compress(raw, 9))
iend = chunk(b'IEND', b'')

out = os.path.join(os.path.dirname(__file__), 'icon.png')
with open(out, 'wb') as f:
    f.write(sig + ihdr + idat + iend)
print(f'Created {out}')
